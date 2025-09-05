import requests
import re
import logging
import time
from typing import Dict, List, Any, Optional
from urllib.parse import quote
from bs4 import BeautifulSoup
from app.config import settings

logger = logging.getLogger(__name__)

class OSINTAnalyzer:
    """OSINT (Open Source Intelligence) analyzer for firmware components"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Rate limiting
        self.request_delay = 1  # seconds between requests
        self.last_request_time = 0
        
    def analyze(self, project, static_results: Dict[str, Any]) -> Dict[str, Any]:
        """Perform OSINT analysis based on project metadata and static analysis results"""
        try:
            results = {
                "results": [],
                "sources_queried": [],
                "analysis_summary": {}
            }
            
            logger.info(f"Starting OSINT analysis for project {project.id}")
            
            # 1. Device-based searches
            if project.device_name or project.device_model:
                device_results = self._search_device_info(project)
                results["results"].extend(device_results)
            
            # 2. Search for default credentials
            if project.device_name and project.manufacturer:
                cred_results = self._search_default_credentials(project)
                results["results"].extend(cred_results)
            
            # 3. Search for known vulnerabilities and exploits
            vuln_results = self._search_vulnerabilities(project, static_results)
            results["results"].extend(vuln_results)
            
            # 4. FCC ID search (if applicable)
            if project.device_model:
                fcc_results = self._search_fcc_database(project)
                results["results"].extend(fcc_results)
            
            # 5. Shodan search (if API key available)
            if settings.shodan_api_key:
                shodan_results = self._search_shodan(project, static_results)
                results["results"].extend(shodan_results)
            
            # 6. Search for firmware updates and security advisories
            advisory_results = self._search_security_advisories(project)
            results["results"].extend(advisory_results)
            
            # Generate summary
            results["analysis_summary"] = self._generate_osint_summary(results["results"])
            
            logger.info(f"OSINT analysis completed. Found {len(results['results'])} results from {len(results['sources_queried'])} sources")
            return results
            
        except Exception as e:
            logger.error(f"OSINT analysis failed: {str(e)}")
            return {"error": str(e), "results": []}
    
    def _rate_limit(self):
        """Implement rate limiting between requests"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.request_delay:
            time.sleep(self.request_delay - time_since_last)
        self.last_request_time = time.time()
    
    def _search_device_info(self, project) -> List[Dict[str, Any]]:
        """Search for general device information"""
        results = []
        
        search_terms = []
        if project.device_name:
            search_terms.append(project.device_name)
        if project.device_model:
            search_terms.append(project.device_model)
        if project.manufacturer:
            search_terms.append(project.manufacturer)
        
        query = " ".join(search_terms) + " firmware manual documentation"
        
        # Google search
        google_results = self._google_search(query, "device_info")
        results.extend(google_results)
        
        return results
    
    def _search_default_credentials(self, project) -> List[Dict[str, Any]]:
        """Search for default credentials"""
        results = []
        
        # Common default credential databases
        credential_queries = [
            f"{project.manufacturer} {project.device_model} default password",
            f"{project.device_name} default login credentials",
            f"{project.manufacturer} router default username password"
        ]
        
        for query in credential_queries:
            # Search known credential databases
            cred_results = self._search_credential_databases(query)
            results.extend(cred_results)
            
            # Google search for credentials
            google_results = self._google_search(query, "credentials")
            results.extend(google_results[:3])  # Limit results
        
        return results
    
    def _search_vulnerabilities(self, project, static_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search for known vulnerabilities and exploits"""
        results = []
        
        # Search based on identified software
        services = static_results.get("services", [])
        for service in services:
            if service.get("found"):
                vuln_query = f"{service['name']} vulnerability exploit"
                vuln_results = self._google_search(vuln_query, "vulnerability")
                results.extend(vuln_results[:2])
        
        # Search for device-specific vulnerabilities
        if project.device_name:
            device_vuln_query = f"{project.device_name} CVE vulnerability security"
            device_results = self._google_search(device_vuln_query, "device_vulnerability")
            results.extend(device_results[:3])
        
        return results
    
    def _search_fcc_database(self, project) -> List[Dict[str, Any]]:
        """Search FCC database for device information"""
        results = []
        
        try:
            # Extract potential FCC ID from device model
            fcc_id_patterns = [
                r'([A-Z0-9]{3}[A-Z0-9-]{1,})',  # Standard FCC ID pattern
                r'FCC[:\s]*([A-Z0-9-]+)',       # FCC: prefix
            ]
            
            search_text = f"{project.device_model} {project.device_name}"
            fcc_id = None
            
            for pattern in fcc_id_patterns:
                match = re.search(pattern, search_text.upper())
                if match:
                    fcc_id = match.group(1)
                    break
            
            if fcc_id:
                self._rate_limit()
                
                # Search FCC database
                fcc_url = f"https://fccid.io/{fcc_id}"
                response = self.session.get(fcc_url, timeout=10)
                
                if response.status_code == 200:
                    results.append({
                        "source": "fcc_database",
                        "query": fcc_id,
                        "title": f"FCC Database Entry: {fcc_id}",
                        "description": f"Official FCC documentation for device {fcc_id}",
                        "url": fcc_url,
                        "confidence_score": 90,
                        "data": {
                            "fcc_id": fcc_id,
                            "type": "regulatory_info"
                        }
                    })
                    
        except Exception as e:
            logger.debug(f"FCC search failed: {str(e)}")
        
        return results
    
    def _search_shodan(self, project, static_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search Shodan for similar devices"""
        results = []
        
        try:
            import shodan
            
            api = shodan.Shodan(settings.shodan_api_key)
            
            # Build search queries based on identified services
            search_queries = []
            
            services = static_results.get("services", [])
            for service in services:
                if service.get("found") and service.get("type"):
                    search_queries.append(f"{service['name']}")
            
            # Add device-specific searches
            if project.manufacturer:
                search_queries.append(f'"{project.manufacturer}"')
            
            for query in search_queries[:3]:  # Limit queries
                try:
                    self._rate_limit()
                    search_results = api.search(query, limit=5)
                    
                    for result in search_results['matches']:
                        results.append({
                            "source": "shodan",
                            "query": query,
                            "title": f"Shodan: {result.get('ip_str', 'Unknown IP')}",
                            "description": f"Similar device found on {result.get('ip_str')} running {query}",
                            "url": f"https://www.shodan.io/host/{result.get('ip_str')}",
                            "confidence_score": 70,
                            "data": {
                                "ip": result.get('ip_str'),
                                "port": result.get('port'),
                                "banner": result.get('data', '')[:200],
                                "location": result.get('location', {}),
                                "org": result.get('org', '')
                            }
                        })
                        
                except shodan.APIError as e:
                    logger.debug(f"Shodan search failed for query '{query}': {str(e)}")
                    continue
                    
        except ImportError:
            logger.warning("Shodan library not available")
        except Exception as e:
            logger.error(f"Shodan search failed: {str(e)}")
        
        return results
    
    def _search_security_advisories(self, project) -> List[Dict[str, Any]]:
        """Search for security advisories and firmware updates"""
        results = []
        
        if not project.manufacturer:
            return results
        
        # Search for security advisories
        advisory_queries = [
            f"{project.manufacturer} security advisory firmware update",
            f"{project.manufacturer} {project.device_model} security bulletin",
            f'site:{project.manufacturer.lower()}.com security advisory'
        ]
        
        for query in advisory_queries:
            advisory_results = self._google_search(query, "security_advisory")
            results.extend(advisory_results[:2])
        
        return results
    
    def _google_search(self, query: str, search_type: str) -> List[Dict[str, Any]]:
        """Perform Google search (using custom search or scraping)"""
        results = []
        
        try:
            self._rate_limit()
            
            # Use Google Custom Search API if available, otherwise fallback to scraping
            search_url = f"https://www.google.com/search?q={quote(query)}&num=5"
            
            response = self.session.get(search_url, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract search results
                search_results = soup.find_all('div', class_='g')
                
                for i, result in enumerate(search_results[:5]):
                    try:
                        title_elem = result.find('h3')
                        link_elem = result.find('a')
                        snippet_elem = result.find('span', class_='aCOpRe') or result.find('div', class_='s')
                        
                        if title_elem and link_elem:
                            title = title_elem.get_text()
                            url = link_elem.get('href')
                            snippet = snippet_elem.get_text() if snippet_elem else ""
                            
                            # Clean up URL
                            if url.startswith('/url?q='):
                                url = url.split('/url?q=')[1].split('&')[0]
                            
                            confidence = self._calculate_confidence(title, snippet, search_type)
                            
                            results.append({
                                "source": "google_search",
                                "query": query,
                                "title": title,
                                "description": snippet,
                                "url": url,
                                "confidence_score": confidence,
                                "data": {
                                    "search_type": search_type,
                                    "result_position": i + 1
                                }
                            })
                            
                    except Exception as e:
                        logger.debug(f"Failed to parse search result: {str(e)}")
                        continue
                        
        except Exception as e:
            logger.debug(f"Google search failed for query '{query}': {str(e)}")
        
        return results
    
    def _search_credential_databases(self, query: str) -> List[Dict[str, Any]]:
        """Search known credential databases"""
        results = []
        
        # Known credential database sites
        credential_sites = [
            "cirt.net/passwords",
            "defaultpassword.us",
            "routerpasswords.com",
            "passworddb.com"
        ]
        
        for site in credential_sites:
            try:
                self._rate_limit()
                
                site_query = f"site:{site} {query}"
                site_results = self._google_search(site_query, "credentials")
                
                # Mark these as high confidence credential results
                for result in site_results:
                    result["confidence_score"] = min(90, result["confidence_score"] + 20)
                    result["data"]["credential_database"] = site
                
                results.extend(site_results[:2])
                
            except Exception as e:
                logger.debug(f"Credential database search failed for {site}: {str(e)}")
                continue
        
        return results
    
    def _calculate_confidence(self, title: str, snippet: str, search_type: str) -> int:
        """Calculate confidence score for OSINT result"""
        confidence = 50  # Base confidence
        
        # Boost confidence based on search type and content
        confidence_keywords = {
            "credentials": ["password", "username", "login", "default", "admin"],
            "vulnerability": ["CVE", "exploit", "vulnerability", "security", "patch"],
            "device_info": ["manual", "documentation", "datasheet", "specification"],
            "security_advisory": ["advisory", "bulletin", "security", "update", "patch"]
        }
        
        text = (title + " " + snippet).lower()
        
        if search_type in confidence_keywords:
            keyword_matches = sum(1 for keyword in confidence_keywords[search_type] if keyword in text)
            confidence += keyword_matches * 10
        
        # Boost for official sources
        official_indicators = ["official", "manufacturer", ".com", "support", "documentation"]
        official_matches = sum(1 for indicator in official_indicators if indicator in text)
        confidence += official_matches * 5
        
        # Cap confidence at 100
        return min(100, confidence)
    
    def _generate_osint_summary(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary of OSINT analysis"""
        summary = {
            "total_results": len(results),
            "sources": {},
            "high_confidence_results": 0,
            "credential_results": 0,
            "vulnerability_results": 0
        }
        
        for result in results:
            source = result.get("source", "unknown")
            summary["sources"][source] = summary["sources"].get(source, 0) + 1
            
            if result.get("confidence_score", 0) >= 80:
                summary["high_confidence_results"] += 1
            
            search_type = result.get("data", {}).get("search_type", "")
            if "credential" in search_type:
                summary["credential_results"] += 1
            elif "vulnerability" in search_type:
                summary["vulnerability_results"] += 1
        
        return summary
