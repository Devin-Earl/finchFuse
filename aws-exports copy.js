/* eslint-disable */
// WARNING: DO NOT EDIT. This file is automatically generated by AWS Amplify. It will be overwritten.

const awsmobile = {
    "aws_project_region": "us-east-1",
    "aws_content_delivery_bucket": "finchuse-20241102121233-hostingbucket-dev",
    "aws_content_delivery_bucket_region": "us-east-1",
    "aws_content_delivery_url": "https://d21q88vqtsviix.cloudfront.net",
    "aws_cloud_logic_custom": [
        {
            "name": "fetchFinchDataApi",
            "endpoint": "https://3h07t598xh.execute-api.us-east-1.amazonaws.com/dev",
            "region": "us-east-1"
        }
    ],
    "aws_cognito_identity_pool_id": "us-east-1:5b21bb93-9709-4f4e-84e7-ea2f81e33bf1",
    "aws_cognito_region": "us-east-1",
    "aws_user_pools_id": "us-east-1_dc1srGwJd",
    "aws_user_pools_web_client_id": "7ir5ks9sgdb6li80vui9dn8mtu",
    "oauth": {
        "domain": "https://finchdemo.auth.us-east-1.amazoncognito.com",
        "scope": ["email", "openid", "profile"],
        "redirectSignIn": "https://finchdemo.perilabs.io",
        "redirectSignOut": "https://finchdemo.auth.us-east-1.amazoncognito.com",
        "responseType": "code"  // Use 'token' for implicit flow if preferred
    },
    "aws_cognito_username_attributes": [],
    "aws_cognito_social_providers": [],
    "aws_cognito_signup_attributes": [
        "EMAIL"
    ],
    "aws_cognito_mfa_configuration": "OFF",
    "aws_cognito_mfa_types": [
        "SMS"
    ],
    "aws_cognito_password_protection_settings": {
        "passwordPolicyMinLength": 8,
        "passwordPolicyCharacters": []
    },
    "aws_cognito_verification_mechanisms": [
        "EMAIL"
    ]
};

export default awsmobile;