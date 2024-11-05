import Amplify, { Auth } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

const ADMIN_COMPANIES = ["botsford", "hettinger", "kemmer", "konopelski", "mosciski", "wolff"];
const STANDARD_COMPANIES = ["MOSCISKI", "HETTINGER"];

document.addEventListener("DOMContentLoaded", hideSections);

function hideSections() {
    document.getElementById('companyInfo').style.display = 'none';
    document.getElementById('employeeDetails').style.display = 'none';
    document.querySelector('.employee-sidebar').style.display = 'none'; // Hide employee directory initially
}

// Helper function to normalize text: replaces underscores with spaces, capitalizes, trims
function normalizeText(text) {
    return text
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();
}

// Normalize company names to title case
function normalizeCompanyName(name) {
    return name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function showCompanyInfo() {
    document.getElementById('companyInfo').style.display = 'block';
}

function showEmployeeDirectory() {
    document.querySelector('.employee-sidebar').style.display = 'block';
}

function showEmployeeDetails() {
    document.getElementById('employeeDetails').style.display = 'block';
}

async function checkAuth() {
    if (localStorage.getItem('authCheckCompleted')) {
        showAppContent();
        displayUserInfo();
        loadCompanyOptions();
        return;
    }

    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = urlParams.get('id_token');
    if (idToken) {
        localStorage.setItem('idToken', idToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.setItem('authCheckCompleted', 'true');
        showAppContent();
        displayUserInfo();
        loadCompanyOptions();
    } else {
        try {
            const session = await Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            localStorage.setItem('idToken', token);
            localStorage.setItem('authCheckCompleted', 'true');
            showAppContent();
            displayUserInfo();
            loadCompanyOptions();
        } catch (error) {
            redirectToLogin();
        }
    }
}

// Display User Information
async function displayUserInfo() {
    try {
        const token = localStorage.getItem('idToken');
        const decodedToken = window.jwt_decode(token);
        const name = decodedToken.name || null;
        const email = decodedToken.email || null;
        const username = decodedToken.username || decodedToken["cognito:username"] || "User";
        document.getElementById('userInfo').textContent = `Hello, ${name || email || username}`;
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
}

// Redirect to Cognito Login
function redirectToLogin() {
    const domain = awsExports.oauth.domain.startsWith('https://') ? awsExports.oauth.domain : `https://${awsExports.oauth.domain}`;
    const redirectUri = awsExports.oauth.redirectSignIn.startsWith('https://') ? awsExports.oauth.redirectSignIn : `https://${awsExports.oauth.redirectSignIn}`;
    const loginUrl = `${domain}/login?client_id=${awsExports.aws_user_pools_web_client_id}&response_type=token&scope=email+openid+profile&redirect_uri=${redirectUri}`;
    window.location.href = loginUrl;
}

// Show Main Content
function showAppContent() {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("appContent").style.display = "block";
}

// Load Company Options Based on User Group
function loadCompanyOptions() {
    const providerSelect = document.getElementById('providerSelect');
    providerSelect.innerHTML = '<option value="" disabled selected>Select a company</option>';
    const token = localStorage.getItem('idToken');
    const decodedToken = window.jwt_decode(token);
    const isAdmin = decodedToken['cognito:groups'] && decodedToken['cognito:groups'].includes('admin');
    const companies = isAdmin ? ADMIN_COMPANIES : STANDARD_COMPANIES;

    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.toLowerCase();
        option.textContent = normalizeCompanyName(company);
        providerSelect.appendChild(option);
    });
}

// Fetch and Display Company and Directory Data
document.getElementById('providerSelect').addEventListener('change', async function () {
    const company = this.value;
    if (company) {
        await fetchCompanyData(company);
        await fetchEmployeeDirectory(company);
        document.getElementById('employeeList').scrollTop = 0; // Reset scroll position
    }
});

// Fetch Company Data
async function fetchCompanyData(company) {
    const token = localStorage.getItem('idToken');
    try {
        const response = await fetch(`https://api.finchdemo.perilabs.io/finchdata?provider=${company}&dataType=company`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            populateCompanyInfo(data);
            showCompanyInfo();
        } else {
            console.error("Error fetching company data:", data.error);
        }
    } catch (error) {
        console.error("Error fetching company data:", error);
    }
}

// Populate Company Information
function populateCompanyInfo(data) {
    const companyDetails = document.getElementById('companyDetails');
    companyDetails.innerHTML = '';
    const info = [
        { label: "Company Name", value: normalizeText(data.legal_name || "Data Not Provided or Blank") },
        { label: "Industry", value: normalizeText(data.entity?.type || "Data Not Provided or Blank") },
        { label: "Subtype", value: normalizeText(data.entity?.subtype || "Data Not Provided or Blank") },
        { label: "Primary Email", value: normalizeText(data.primary_email || "Data Not Provided or Blank") },
        { label: "Primary Phone Number", value: normalizeText(data.primary_phone_number || "Data Not Provided or Blank") },
    ];

    info.forEach(({ label, value }) => {
        const row = document.createElement('tr');
        row.innerHTML = `<th>${label}</th><td>${value}</td>`;
        companyDetails.appendChild(row);
    });
}

// Fetch Employee Directory
async function fetchEmployeeDirectory(company) {
    const token = localStorage.getItem('idToken');
    try {
        const response = await fetch(`https://api.finchdemo.perilabs.io/finchdata?provider=${company}&dataType=directory`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            populateEmployeeList(data.individuals);
            showEmployeeDirectory();
        } else {
            console.error("Error fetching employee directory:", data.error);
        }
    } catch (error) {
        console.error("Error fetching employee directory:", error);
    }
}

// Populate Employee List
function populateEmployeeList(individuals) {
    const employeeList = document.getElementById('employeeList');
    employeeList.innerHTML = '';
    individuals.forEach(individual => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.textContent = normalizeText(`${individual.first_name} ${individual.last_name}`);
        listItem.dataset.id = individual.id;
        listItem.addEventListener('click', () => fetchEmployeeDetails(individual.id));
        employeeList.appendChild(listItem);
    });
}

// Fetch Individual Employee Details
async function fetchEmployeeDetails(employeeId) {
    const token = localStorage.getItem('idToken');
    const company = document.getElementById('providerSelect').value;
    try {
        const response = await fetch(`https://api.finchdemo.perilabs.io/finchdata?provider=${company}&dataType=individual`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ requests: [{ individual_id: employeeId }] })
        });
        const data = await response.json();
        if (response.ok) {
            populateEmployeeDetails(data.responses[0].body);
            showEmployeeDetails();
        } else {
            console.error("Error fetching employee details:", data.error);
        }
    } catch (error) {
        console.error("Error fetching employee details:", error);
    }
}

// Populate Employee Details
function populateEmployeeDetails(data) {
    document.getElementById('employeeName').textContent = `Employee Name: ${normalizeText(data.first_name)} ${normalizeText(data.last_name)}`;
    document.getElementById('preferredName').textContent = normalizeText(data.preferred_name || "Data Not Provided or Blank");

    // Handle emails array
    const emails = data.emails && Array.isArray(data.emails)
        ? data.emails.map(emailObj => emailObj.data).join(", ")
        : "Data Not Provided or Blank";
    document.getElementById('emails').textContent = emails;

    // Handle phone numbers array
    const phoneNumbers = data.phone_numbers && Array.isArray(data.phone_numbers)
        ? data.phone_numbers.map(phoneObj => phoneObj.data).join(", ")
        : "Data Not Provided or Blank";
    document.getElementById('phoneNumbers').textContent = phoneNumbers;

    document.getElementById('gender').textContent = normalizeText(data.gender || "Data Not Provided or Blank");
    document.getElementById('dob').textContent = normalizeText(data.dob || "Data Not Provided or Blank");
    document.getElementById('residence').textContent = normalizeText(data.residence || "Data Not Provided or Blank");
    document.getElementById('ethnicity').textContent = normalizeText(data.ethnicity || "Data Not Provided or Blank");
}
// Initialize authentication and user info display
if (!localStorage.getItem('authCheckCompleted')) {
    checkAuth();
}
