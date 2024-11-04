import Amplify, { Auth } from 'aws-amplify';
import awsExports from './aws-exports';

Amplify.configure(awsExports);

// Removed the import statement for jwt-decode, since we’re using the CDN.

async function checkAuth() {
    if (localStorage.getItem('authCheckCompleted')) {
        showAppContent();
        displayUserInfo();
        return;
    }

    console.log("Starting authentication check...");
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = urlParams.get('access_token');

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.setItem('authCheckCompleted', 'true');
        showAppContent();
        displayUserInfo();
    } else {
        try {
            const session = await Auth.currentSession();
            const token = session.getAccessToken().getJwtToken();
            localStorage.setItem('accessToken', token);
            localStorage.setItem('authCheckCompleted', 'true');
            showAppContent();
            displayUserInfo();
        } catch (error) {
            console.log("User is not authenticated. Redirecting to Cognito Hosted UI.");
            redirectToLogin();
        }
    }
}

async function displayUserInfo() {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error("No access token found for decoding user info.");
            return;
        }

        const decodedToken = jwt_decode(token); // Use the global jwt_decode function
        console.log("Decoded token:", decodedToken);

        const email = decodedToken.email || null;
        const username = decodedToken.username || decodedToken["cognito:username"] || "User";

        document.getElementById('userInfo').textContent = `Hello, ${email || username}`;
    } catch (error) {
        console.error("Error fetching user info:", error);
    }
}

function redirectToLogin() {
    const domain = awsExports.oauth.domain.startsWith('https://')
        ? awsExports.oauth.domain
        : `https://${awsExports.oauth.domain}`;

    const redirectUri = awsExports.oauth.redirectSignIn.startsWith('https://')
        ? awsExports.oauth.redirectSignIn
        : `https://${awsExports.oauth.redirectSignIn}`;

    const loginUrl = `${domain}/login?client_id=${awsExports.aws_user_pools_web_client_id}&response_type=token&scope=email+openid+profile&redirect_uri=${redirectUri}`;
    console.log(`Redirecting to login at: ${loginUrl}`);
    window.location.href = loginUrl;
}

function showAppContent() {
    document.getElementById("loadingScreen").style.display = "none";
    document.getElementById("appContent").style.display = "block";
    console.log("App content is now visible.");
}

// Run authentication check only if it hasn't been completed
if (!localStorage.getItem('authCheckCompleted')) {
    checkAuth();
}

// Only clear authentication state on explicit logout or page refresh, not on navigation
window.addEventListener("load", () => {
    if (!sessionStorage.getItem("authCheckPersist")) {
        sessionStorage.setItem("authCheckPersist", "set");
        console.log("Setting auth check persist flag to prevent repeated reset");
    }
});

async function fetchData() {
    let token = localStorage.getItem('accessToken');
    if (!token) {
        try {
            const session = await Auth.currentSession();
            token = session.getAccessToken().getJwtToken();
            localStorage.setItem('accessToken', token);
        } catch (error) {
            console.error("No valid session found. Redirecting to login.");
            redirectToLogin();
            return;
        }
    }

    const provider = document.getElementById('providerSelect').value;
    const dataType = document.getElementById('dataTypeSelect').value;
    const errorMessage = document.getElementById('errorMessage');
    const table = document.getElementById('dataTable');
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');

    errorMessage.style.display = 'none';
    table.style.display = 'none';
    tableHeaders.innerHTML = '';
    tableBody.innerHTML = '';

    if (!provider || !dataType) {
        errorMessage.innerText = "Please select both a provider and a data type.";
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`https://api.finchdemo.perilabs.io/finchdata?provider=${provider}&dataType=${dataType}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch data");
        }

        populateTable(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        errorMessage.innerText = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
    }
}

function populateTable(data) {
    const table = document.getElementById('dataTable');
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');

    const headers = Object.keys(data[0] || {});
    const rows = data.map(Object.values);

    headers.forEach(header => {
        const th = document.createElement('th');
        th.innerText = header;
        tableHeaders.appendChild(th);
    });

    rows.forEach(rowData => {
        const tr = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.innerText = cellData;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    table.style.display = 'table';
}
