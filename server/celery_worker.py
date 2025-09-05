#!/usr/bin/env python3
"""
Celery worker startup script for Odin Firmware Intelligence
"""

from app.services.celery_app import celery_app

if __name__ == '__main__':
    celery_app.start()
