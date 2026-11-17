"""
MetroAI Automated Test Suite (Test Cases A through N)
Calls complete verification runner covering all functional, security, and ML cases.
"""

import sys
import os

# Add metroai-backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from verify_audit_tests import run_verification

if __name__ == "__main__":
    run_verification()
