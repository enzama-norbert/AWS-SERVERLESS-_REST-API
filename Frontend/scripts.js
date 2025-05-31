      let records = [];
      let editIndex = -1;
      const form = document.getElementById("record-form");
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const recordList = document.getElementById("record-list");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        if (!name || !email) return;
        if (editIndex === -1) {
          records.push({ name, email });
        } else {
          records[editIndex] = { name, email };
          editIndex = -1;
        }
        nameInput.value = "";
        emailInput.value = "";
        renderTable();
      });
      function renderTable() {
        recordList.innerHTML = "";
        records.forEach((record, index) => {
          const row = document.createElement("tr");
          row.innerHTML = ` <td>${record.name}</td> <td>${record.email}</td> <td> <button class="btn btn-sm btn-warning me-1" onclick="editRecord(${index})"> <i class="bi bi-pencil-square"></i> Edit </button> <button class="btn btn-sm btn-danger" onclick="deleteRecord(${index})"> <i class="bi bi-trash"></i> Delete </button> </td> `;
          recordList.appendChild(row);
        });
      }
      function editRecord(index) {
        const record = records[index];
        nameInput.value = record.name;
        emailInput.value = record.email;
        editIndex = index;
      }
      function deleteRecord(index) {
        if (confirm("Are you sure you want to delete this record?")) {
          records.splice(index, 1);
          renderTable();
        }
      }
      renderTable();
