import os
import json
import requests
import jwt 
from loguru import logger

STANDARD_USER_ACCESS = {"MOSCISKI", "HETTINGER"}
BASE_URL = "https://api.tryfinch.com"

def get_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Finch-Api-Version": "2020-09-17"
    }

def error_logic(response):
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 401:
        logger.error("401 Unauthorized - Token may need reauthorization.")
        return {"error": "401 Unauthorized - Token may need reauthorization"}
    elif response.status_code == 408:
        logger.error("408 Request Timeout")
        return {"error": "408 Request Timeout"}
    elif response.status_code == 500:
        logger.error("500 Internal Server Error")
        return {"error": "500 Internal Server Error"}
    else:
        logger.error(f"Unexpected error: {response.status_code}")
        return {
            "error": f"Unexpected error: {response.status_code}",
            "message": response.text
        }

def fetch_company_data(token):
    logger.info("Fetching company data...")
    response = requests.get(f"{BASE_URL}/employer/company", headers=get_headers(token))
    return error_logic(response)

def fetch_directory_data(token):
    logger.info("Fetching directory data...")
    response = requests.get(f"{BASE_URL}/employer/directory", headers=get_headers(token))
    return error_logic(response)

def fetch_individual_data(token, individual_id):
    logger.info(f"Fetching individual data for individual ID: {individual_id}...")
    body = {
        "requests": [
            {"individual_id": individual_id}
        ]
    }
    response = requests.post(f"{BASE_URL}/employer/individual", headers=get_headers(token), json=body)
    return error_logic(response)

def fetch_employment_data(token, individual_id):
    logger.info(f"Fetching employment data for individual ID: {individual_id}...")
    response = requests.get(f"{BASE_URL}/employer/employment/{individual_id}", headers=get_headers(token))
    return error_logic(response)

def lambda_handler(event, context):
    # Check if the request method is OPTIONS for CORS preflight
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',  # Adjust this to restrict origins if needed
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({"message": "CORS preflight success"})
        }

    # Get the token from the Authorization header
    token = event['headers'].get('Authorization', '').split(' ')[1]
    decoded_token = jwt.decode(token, options={"verify_signature": False})  # Skip signature verification for testing
    
    user_groups = decoded_token.get("cognito:groups", [])
    is_admin = "admin" in user_groups
    
    provider = event['queryStringParameters'].get('provider', '').upper()
    data_type = event['queryStringParameters'].get('dataType', '').lower()
    individual_id = event['queryStringParameters'].get('individualId')

    # Access control for non-admin users
    if not is_admin and provider not in STANDARD_USER_ACCESS:
        logger.error("Access denied: User does not have access to this provider.")
        return {
            'statusCode': 403,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({"error": "Access denied to this provider"})
        }

    # Get the provider's access token from environment variables
    access_token = os.getenv(f"FINCH_ACCESS_TOKEN_{provider}")
    if not access_token:
        logger.error("Invalid provider or missing access token.")
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({"error": "Invalid provider or missing access token"})
        }

    # Fetch the requested data based on data type
    try:
        if data_type == "company":
            data = fetch_company_data(access_token)
        elif data_type == "directory":
            data = fetch_directory_data(access_token)
        elif data_type == "individual" and individual_id:
            data = fetch_individual_data(access_token, individual_id)
        elif data_type == "employment" and individual_id:
            data = fetch_employment_data(access_token, individual_id)
        else:
            logger.error("Invalid data type or missing individual ID.")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({"error": "Invalid data type or missing individual ID"})
            }

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps(data)
        }
    except requests.exceptions.RequestException as e:
        logger.exception("Request Failed")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': json.dumps({"error": str(e)})
        }
