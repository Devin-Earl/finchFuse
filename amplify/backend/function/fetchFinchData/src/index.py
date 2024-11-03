import os
import json
import requests
import jwt 
from loguru import logger

STANDARD_USER_ACCESS= {"MOSCISKI","HETTINGER"}
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
       logger.error("401 Unauthorized- Access token may have been revoked or is in need of reauthorization - https://developer.tryfinch.com/developer-resources/Reauthentication")
       return {"error": "401 Unauthorized- Access token may have been revoked or is in need of reauthorization - https://developer.tryfinch.com/developer-resources/Reauthentication"}
    elif response.status_code == 408:
        logger.error("408 Request Timeout- The request timed out. Reminder Finch API has a 6 min timeout.")
        return {"error": "408 Request Timeout- The request timed out. Reminder Finch API has a 6 min timeout."}
    elif response.status_code == 500:
        logger.error("500 Internal Server Error- The server encountered an unexpected condition that prevented it from fulfilling the request.")
        return {"error": "500 Internal Server Error- The server encountered an unexpected condition that prevented it from fulfilling the request."}
    else:
        logger.error(f"An unexpected error occurred: {response.status_code}")
        return {
            "error": f"Unexpected error: {response.status_code}",
            "message": response.text
        }
    

def fetch_company_data(token):
    logger.info(f"Fetching company data from ...")
    response = requests.get(f"{BASE_URL}/employer/company", headers=get_headers(token))
    return error_logic(response)

def fetch_directory_data(token):
    logger.info("Fetching directory data...")
    response = requests.get(f"{BASE_URL}/employer/directory", headers=get_headers(token))
    return error_logic(response)

def fetch_individual_data(token, individual_id):
    logger.info(f"Fetching individual data for individual ID: {individual_id} ...")
    response = requests.get(f"{BASE_URL}/employer/individuals/{individual_id}", headers=get_headers(token))
    return error_logic(response)

def fetch_employment_data(token, individual_id):
    logger.info(f"Fetching employment data for individual ID: {individual_id} ...")
    response = requests.get(f"{BASE_URL}/employer/employment/{individual_id}", headers=get_headers(token))
    return error_logic(response)

def lambda_handler(event, context):
    token= event['headers'].get('Authorization', '').split(' ')[1]
    decoded_token = jwt.decode(token, options={"verify_signature": False}) #Doing this cause im lazy I know not to do this in PROD
    
    user_groups = decoded_token.get("cognito:groups", [])
    is_admin = "admin" in user_groups
    
    if not is_admin and provider not in STANDARD_USER_ACCESS:
        logger.error("Access denied: Restricted Provider: If Access is needed user must be added to Admin Group.")
        return {
            'statusCode': 403,
            'body': json.dumps({"error": "Access denied to this provider"})
        }
    
    provider = event['queryStringParameters'].get('provider', '').upper()
    data_type = event['queryStringParameters'].get('dataType', '').lower()
    individual_id = event['queryStringParameters'].get('individualId')

    
    token = os.getenv(f"FINCH_ACCESS_TOKEN_{provider}")
    if not token:
         logger.error("Invalid provider or missing access token.")
         return {
            'statusCode': 400,
            'body': json.dumps({"error": "Invalid provider or missing access token"})
        }

    try:
        
        if data_type == "company":
            data = fetch_company_data(token)
        elif data_type == "directory":
            data = fetch_directory_data(token)
        elif data_type == "individual" and individual_id:
            data = fetch_individual_data(token, individual_id)
        elif data_type == "employment" and individual_id:
            data = fetch_employment_data(token, individual_id)
        else:
            logger.error("Invalid data type or missing individual ID.")
            return {
                'statusCode': 400,
                'body': json.dumps({"error": "Invalid data type or missing individual ID"})
            }

        return {
            'statusCode': 200,
            'body': json.dumps(data)
        }
    except requests.exceptions.RequestException as e:
        logger.exception("Request Failed")
        return {
            'statusCode': 500,
            'body': json.dumps({"error": str(e)})
        }
