
const complaintForm = document.getElementById("complaintForm");
const formMessage = document.getElementById("formMessage");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const resolvedCount = document.getElementById("resolvedCount");
const recentComplaints = document.getElementById("recentComplaints");

// Display a message safely
function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

// Create complaint activity using safe text nodes
function displayComplaints(complaints) {
    totalCount.textContent = complaints.length;

    pendingCount.textContent = complaints.filter(
        complaint => complaint.status === "Pending"
    ).length;

    resolvedCount.textContent = complaints.filter(
        complaint => complaint.status === "Resolved"
    ).length;

    recentComplaints.replaceChildren();

    if (complaints.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const symbol = document.createElement("span");
        symbol.textContent = "✦";

        const message = document.createElement("p");
        message.textContent = "Your complaint activity will appear here.";

        empty.append(symbol, message);
        recentComplaints.appendChild(empty);
        return;
    }

    complaints.slice(0, 3).forEach(complaint => {
        const item = document.createElement("div");
        item.className = "recent-item";

        const details = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = complaint.category;

        const description = document.createElement("small");
        description.textContent = `Room ${complaint.roomNumber}`;

        details.append(title, description);

        const status = document.createElement("span");
        status.className = "status-badge";

        if (complaint.status === "Resolved") {
            status.classList.add("resolved");
        } else if (complaint.status === "In Progress") {
            status.classList.add("progress");
        }

        status.textContent = complaint.status;

        item.append(details, status);
        recentComplaints.appendChild(item);
    });
}

// Load complaints from the backend
async function loadComplaints() {
    try {
        const response = await fetch("/api/complaints");

        if (!response.ok) {
            throw new Error("Could not load complaints");
        }

        const data = await response.json();
        displayComplaints(data.complaints);
    } catch (error) {
        console.error("Loading error:", error);
    }
}

// Submit a new complaint
complaintForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!complaintForm.reportValidity()) {
        return;
    }

    const submitButton = complaintForm.querySelector(
        'button[type="submit"]'
    );

    const complaint = {
        studentName: document.getElementById("studentName").value.trim(),
        roomNumber: document.getElementById("roomNumber").value.trim(),
        category: document.getElementById("category").value,
        priority: document.getElementById("priority").value,
        description: document.getElementById("description").value.trim()
    };

    if (
        !complaint.studentName ||
        !complaint.roomNumber ||
        !complaint.category ||
        !complaint.priority ||
        !complaint.description
    ) {
        showMessage("Please complete all fields.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
        const response = await fetch("/api/complaints", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(complaint)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to submit complaint.");
        }

        showMessage(
            `Complaint submitted successfully! ID: ${data.complaint.complaintId}`,
            "success"
        );

        complaintForm.reset();
        await loadComplaints();
    } catch (error) {
        showMessage(
            error.message || "Unable to connect to the server.",
            "error"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Complaint <span>→</span>';
    }
});

// Load existing complaints when the page opens
loadComplaints();

/* ===== TRACK COMPLAINT FUNCTIONALITY ===== */

const trackingForm = document.getElementById("trackingForm");

if (trackingForm) {
    trackingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const trackingId = document
            .getElementById("trackingId")
            .value.trim();

        const trackingMessage =
            document.getElementById("trackingMessage");

        const trackingResult =
            document.getElementById("trackingResult");

        trackingMessage.textContent = "Checking complaint status...";
        trackingResult.replaceChildren();

        try {
            const response = await fetch(
                `/api/complaints/track/${encodeURIComponent(trackingId)}`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                trackingMessage.textContent =
                    data.message || "Complaint not found. Check your ID.";
                return;
            }

            const complaint = data.complaint;

            trackingMessage.textContent = "Complaint found successfully!";

            const card = document.createElement("div");
            card.className = "tracking-result-card";

            const heading = document.createElement("h3");
            heading.textContent = "Complaint Details";

            const details = [
                ["Complaint ID", complaint.complaintId],
                ["Student Name", complaint.studentName],
                ["Room Number", complaint.roomNumber],
                ["Category", complaint.category],
                ["Priority", complaint.priority],
                ["Status", complaint.status],
                ["Description", complaint.description]
            ];

            card.appendChild(heading);

            details.forEach(([label, value]) => {
                const paragraph = document.createElement("p");
                paragraph.textContent = `${label}: ${value ?? "Not available"}`;
                card.appendChild(paragraph);
            });

            trackingResult.appendChild(card);

        } catch (error) {
            console.error("Tracking error:", error);

            trackingMessage.textContent =
                "Unable to check status. Please try again.";
        }
    });
}

