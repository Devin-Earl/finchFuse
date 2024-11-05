# FinchFuse - Harnessing The Power of HRIS Data
## A Demo of What One Can Do When Overengineering a Simple Problem & Really Wanting a Job

_So What is FinchFuse?_

What a great question! FinchFuse is my interpretation of a tech challenge that will, hopefully, land me a role. It's a simple serverless application that allows a user to view data from several Finch API endpoints. The application is built using a myriad of AWS technologies (see Architecture Diagram below).

_What APIs from Finch are we using?_

For more information on the Finch APIs, please visit the [Finch API Documentation](https://developer.tryfinch.com/api-reference/organization/company).

The following APIs are leveraged by this application (internally using our own developed API):
* [/Company](https://developer.tryfinch.com/docs/reference/33162be1eed72-company)
* [/Directory](https://developer.tryfinch.com/docs/reference/12419c085fc0e-directory)
* [/Individual](https://developer.tryfinch.com/docs/reference/9d6c83b09e205-individual)
* [/Employment](https://developer.tryfinch.com/docs/reference/1ba5cdec4c979-employment)

_What Does The UI Do?_

The UI allows a user to view a list of companies and their details. Additionally, users can view a list of employees for a specific company and see detailed information about each employee.

_Are There Different Kinds of Access to FinchFuse?_

Absolutely. To demonstrate the power of AWS Cognito and RBAC (Role-Based Access Control), there are two different roles that can be assigned to a user:
* `Admin` - This role has access to all FinchFuse functionality.
* `User` - This role has access only to the Company and Employee functionality for specific companies.

_What Technologies Are Used?_

Yet again, another fantastic question! Take a look at the architecture diagram below to see the technologies used in this application.

![Architecture Diagram](./finchFuse%20Architecture%20Diag.png)

_Questions_

Below are some frequently asked questions regarding this solution and best practices:

1. **How does your application respond when a field returned by the provider is null?**

   The application’s frontend JavaScript (`app.js`) and backend Lambda function include error handling to check for missing or null values. If the provider returns a null field, the backend Lambda function still passes the data to the frontend, which displays a user-friendly message: "Data Not Found/Available."

2. **How does your application respond when a provider does not implement an endpoint?**

   The backend Lambda function catches HTTP errors, including a `404 Not Found` error if the provider does not implement a requested endpoint. When this error occurs, it logs an error message and sends a custom message back to the frontend: "Uh-Oh: This Provider hasn't fully utilized {endpoint} yet."

3. **Where is your access token stored?**

   Access tokens for each provider are securely stored as environment variables in AWS Lambda, preventing token exposure. They are not hard-coded or stored in the codebase, ensuring they are only accessible during Lambda’s execution.

   To add security, I used AWS IAM policies & KMS that restrict permissions on these tokens, ensuring only the Lambda function can access them.

4. **Given more time, what would you want to do to make it better?**

   I would work on the frontend and give it  a better UI refine authentication build a homegrown login instead of a Hosted UI, implement token refresh mechanisms for reliability, and potentially add a caching layer for frequently requested data.

