async function fetchData() {
    const provider = document.getElementById('providerSelect').value;
    const dataType = document.getElementById('dataTypeSelect').value;
    const errorMessage = document.getElementById('errorMessage');
    const table = document.getElementById('dataTable');
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');

    // Reset table and error message
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
        // Call the API endpoint based on the provider and data type
        const response = await fetch(`https://your-api-endpoint.amazonaws.com/fetchData?provider=${provider}&dataType=${dataType}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch data");
        }

        // Populate the table with data
        populateTable(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        errorMessage.innerText = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
    }
}

// Function to populate the table with the data
function populateTable(data) {
    const table = document.getElementById('dataTable');
    const tableHeaders = document.getElementById('tableHeaders');
    const tableBody = document.getElementById('tableBody');

    // Extract headers and rows from the data
    const headers = Object.keys(data[0] || {});
    const rows = data.map(Object.values);

    // Add headers to the table
    headers.forEach(header => {
        const th = document.createElement('th');
        th.innerText = header;
        tableHeaders.appendChild(th);
    });

    // Add rows to the table
    rows.forEach(rowData => {
        const tr = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            td.innerText = cellData;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    // Display the table
    table.style.display = 'table';
}
