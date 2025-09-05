import logging
import logging.config
import os
from pathlib import Path

def setup_logging():
    """Setup logging configuration for Odin Firmware Intelligence"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'detailed': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
            },
            'simple': {
                'format': '%(levelname)s - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'simple',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'DEBUG',
                'formatter': 'detailed',
                'filename': 'logs/odin.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5
            },
            'error_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'detailed',
                'filename': 'logs/odin_errors.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5
            },
            'analysis_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'INFO',
                'formatter': 'detailed',
                'filename': 'logs/analysis.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 3
            }
        },
        'loggers': {
            'app.services.analyzers': {
                'handlers': ['analysis_file', 'console'],
                'level': 'INFO',
                'propagate': False
            },
            'app.services.extractors': {
                'handlers': ['analysis_file', 'console'],
                'level': 'INFO',
                'propagate': False
            },
            'celery': {
                'handlers': ['file', 'console'],
                'level': 'INFO',
                'propagate': False
            }
        },
        'root': {
            'level': 'INFO',
            'handlers': ['console', 'file', 'error_file']
        }
    }
    
    logging.config.dictConfig(logging_config)
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('requests').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
