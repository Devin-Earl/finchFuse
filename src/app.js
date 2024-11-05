import Amplify, { Auth } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

const ADMIN_COMPANIES = ["botsford", "hettinger", "kemmer", "konopelski", "mosciski", "wolff"];
const STANDARD_COMPANIES = ["MOSCISKI", "HETTINGER"];

document.addEventListener("DOMContentLoaded", () => {
    hideSections();
    
    // Add logout button functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        redirectToLogout();
    });
});

function hideSections() {
    document.getElementById('companyInfo').style.display = 'none';
    document.getElementById('employeeDetails').style.display = 'none';
    document.querySelector('.employee-sidebar').style.display = 'none';
}

// Helper function to normalize company names to title case
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
        if (!token) {
            console.error("No idToken found for decoding user info.");
            return;
        }
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

// Redirect to Cognito Logout
function redirectToLogout() {
    const domain = awsExports.oauth.domain.startsWith('https://') ? awsExports.oauth.domain : `https://${awsExports.oauth.domain}`;
    const redirectUri = awsExports.oauth.redirectSignOut.startsWith('https://') ? awsExports.oauth.redirectSignOut : `https://${awsExports.oauth.redirectSignOut}`;
    const logoutUrl = `${domain}/logout?client_id=${awsExports.aws_user_pools_web_client_id}&logout_uri=${redirectUri}`;
    localStorage.clear(); // Clear local storage to log out fully
    window.location.href = logoutUrl;
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
        { label: "Company Name", value: data.legal_name || "Data Not Provided or Blank" },
        { label: "Industry", value: data.entity?.type || "Data Not Provided or Blank" },
        { label: "Subtype", value: data.entity?.subtype || "Data Not Provided or Blank" },
        { label: "Primary Email", value: data.primary_email || "Data Not Provided or Blank" },
        { label: "Primary Phone Number", value: data.primary_phone_number || "Data Not Provided or Blank" },
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
        listItem.textContent = `${individual.first_name} ${individual.last_name}`;
        listItem.dataset.id = individual.id;
        listItem.addEventListener('click', () => fetchEmployeeDetails(individual.id));
        employeeList.appendChild(listItem);
    });
}

// Fetch Individual Employee Details
async function fetchEmployeeDetails(employeeId) {
    const token = localStorage.getItem('idToken');
    const company = document.getElementById('providerSelect').value;

    const payload = JSON.stringify({
        requests: [{ individual_id: employeeId }]
    });

    try {
        const response = await fetch(`https://api.finchdemo.perilabs.io/finchdata?provider=${company}&dataType=individual`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: payload
        });

        const data = await response.json();

        if (response.ok) {
            populateEmployeeDetails(data.responses[0]?.body || {});
            showEmployeeDetails();
        } else {
            console.error("Error fetching employee details:", data.error, "Response:", data);
        }
    } catch (error) {
        console.error("Error fetching employee details:", error);
    }
}
function capitalizeWords(str) {
    return typeof str === 'string' ? str.replace(/\b\w/g, char => char.toUpperCase()).replace(/_/g, ' ').trim() : str;
}

function populateEmployeeDetails(data) {
    const details = {
        employeeName: capitalizeWords(`${data.first_name || ''} ${data.last_name || ''}`.trim()),
        preferredName: capitalizeWords(data.preferred_name || "Data Not Provided or Blank"),
        emails: Array.isArray(data.emails)
            ? data.emails.map(e => capitalizeWords(e.data || "Data Not Provided or Blank")).join(", ")
            : "Data Not Provided or Blank",
        phoneNumbers: Array.isArray(data.phone_numbers)
            ? data.phone_numbers
                .map(p => (typeof p === 'object' ? p.number : p) || "Data Not Provided or Blank")
                .filter(num => num !== "Data Not Provided or Blank")
                .join(", ") || "Data Not Provided or Blank"
            : "Data Not Provided or Blank",
        gender: capitalizeWords(data.gender || "Data Not Provided or Blank"),
        dob: data.dob || "Data Not Provided or Blank",
        residence: (data.residence && typeof data.residence === 'object' && data.residence.city && data.residence.state)
            ? `${capitalizeWords(data.residence.city)}, ${capitalizeWords(data.residence.state)}`
            : "Data Not Provided or Blank",
        ethnicity: capitalizeWords(data.ethnicity || "Data Not Provided or Blank")
    };

    Object.keys(details).forEach(id => {
        document.getElementById(id).textContent = details[id];
    });
}
// Initialize authentication and user info display
if (!localStorage.getItem('authCheckCompleted')) {
    checkAuth();
}
