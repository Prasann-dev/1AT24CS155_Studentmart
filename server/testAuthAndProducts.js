const assert = require("assert");

const BASE_URL = "http://localhost:5002";

async function runTests() {
    console.log("=== STARTING STUDENTMART SECURITY & FUNCTIONALITY TEST SUITE ===\n");
    let passed = 0;
    let failed = 0;

    function record(name, condition, details = "") {
        if (condition) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${name} ${details ? "- " + details : ""}`);
            failed++;
        }
    }

    try {
        // Test 1: Health Check
        const healthRes = await fetch(`${BASE_URL}/`);
        const healthData = await healthRes.json();
        record("API Health Check is running", healthRes.ok && healthData.message.includes("StudentMart"));

        // Test 2: Student Registration
        const testStudentEmail = `student_${Date.now()}@campus.edu`;
        const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test Student",
                email: testStudentEmail,
                password: "Password@123"
            })
        });
        const regData = await regRes.json();
        record("Student registration succeeds with student role", regRes.status === 201);

        // Test 3: Student Login
        const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testStudentEmail,
                password: "Password@123"
            })
        });
        const studentLoginData = await studentLoginRes.json();
        record("Student login succeeds", studentLoginRes.ok && !!studentLoginData.token);
        record("Student role is strictly 'student'", studentLoginData.user?.role === "student");
        const studentToken = studentLoginData.token;

        // Test 4: Student attempting to log in via Admin Portal
        const studentAdminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testStudentEmail,
                password: "Password@123"
            })
        });
        record("Student login via Admin Portal is BLOCKED (403 Forbidden)", studentAdminLoginRes.status === 403);

        // Test 5: Admin Login
        const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "admin@studentmart.com",
                password: "Admin@12345"
            })
        });
        const adminLoginData = await adminLoginRes.json();
        record("Admin login succeeds via Admin Portal", adminLoginRes.ok && !!adminLoginData.token);
        record("Admin role is strictly 'admin'", adminLoginData.user?.role === "admin");
        const adminToken = adminLoginData.token;

        // Test 6: Student attempting to Add Product (Must be forbidden)
        const studentAddRes = await fetch(`${BASE_URL}/api/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({
                name: "Hacked Book by Student",
                price: 10,
                category: "Books",
                description: "Student unauthorized product"
            })
        });
        record("Student CANNOT add products to store (403 Forbidden)", studentAddRes.status === 403);

        // Test 7: Unauthenticated request to Add Product (Must be 401 Unauthorized)
        const unauthAddRes = await fetch(`${BASE_URL}/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Unauthenticated Product",
                price: 20
            })
        });
        record("Unauthenticated request to add product is BLOCKED (401 Unauthorized)", unauthAddRes.status === 401);

        // Test 8: Admin Adds Product
        const adminAddRes = await fetch(`${BASE_URL}/api/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: "Data Structures & Algorithms in Java",
                price: 499,
                category: "Books",
                stock: 25,
                description: "Standard university textbook in excellent condition.",
                imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"
            })
        });
        const addedProduct = await adminAddRes.json();
        record("Admin CAN add new products (201 Created)", adminAddRes.status === 201 && !!addedProduct._id);
        const productId = addedProduct._id;

        // Test 9: Admin Fetches Dashboard Statistics
        const statsRes = await fetch(`${BASE_URL}/api/products/stats`, {
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        const statsData = await statsRes.json();
        record("Admin can fetch dashboard statistics", statsRes.ok && statsData.totalProducts > 0);

        // Test 10: Student attempting to fetch Admin Stats (Must be 403 Forbidden)
        const studentStatsRes = await fetch(`${BASE_URL}/api/products/stats`, {
            headers: { "Authorization": `Bearer ${studentToken}` }
        });
        record("Student CANNOT access admin dashboard statistics (403 Forbidden)", studentStatsRes.status === 403);

        // Test 11: Student attempting to Edit Product (Must be 403 Forbidden)
        const studentEditRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${studentToken}`
            },
            body: JSON.stringify({ price: 1 })
        });
        record("Student CANNOT edit existing products (403 Forbidden)", studentEditRes.status === 403);

        // Test 12: Admin Edits Product
        const adminEditRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: "Data Structures & Algorithms (Updated 3rd Edition)",
                price: 549,
                stock: 30
            })
        });
        const editData = await adminEditRes.json();
        record("Admin CAN edit existing products", adminEditRes.ok && editData.product?.price === 549);

        // Test 13: Student Browses Products (Updated product appears)
        const browseRes = await fetch(`${BASE_URL}/api/products`);
        const browseData = await browseRes.json();
        const found = browseData.find(p => p._id === productId);
        record("Updated product appears in student shopping catalog", !!found && found.name.includes("Updated 3rd Edition"));

        // Test 14: Student Shopping Order Placement (Cart checkout)
        const orderRes = await fetch(`${BASE_URL}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                invoiceNo: `INV-${Date.now().toString().slice(-8)}`,
                username: "Test Student",
                email: testStudentEmail,
                date: "18 Nov 2026",
                items: [{ _id: productId, name: found.name, price: found.price, quantity: 2 }],
                total: found.price * 2,
                barcodeValue: "123456789012"
            })
        });
        const orderData = await orderRes.json();
        record("Student shopping order placement succeeds", orderRes.ok && !!orderData._id);

        // Test 15: Student Order History
        const orderHistoryRes = await fetch(`${BASE_URL}/api/orders/${testStudentEmail}`);
        const orderHistoryData = await orderHistoryRes.json();
        record("Student can view their order history", orderHistoryRes.ok && orderHistoryData.length > 0);

        // Test 16: Student attempting to Delete Product (Must be 403 Forbidden)
        const studentDeleteRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${studentToken}` }
        });
        record("Student CANNOT delete products (403 Forbidden)", studentDeleteRes.status === 403);

        // Test 17: Admin Deletes Product
        const adminDeleteRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        record("Admin CAN delete products", adminDeleteRes.ok);

        // Test 18: Verify Product is Removed from Catalog
        const verifyBrowseRes = await fetch(`${BASE_URL}/api/products`);
        const verifyBrowseData = await verifyBrowseRes.json();
        const deletedFound = verifyBrowseData.find(p => p._id === productId);
        record("Deleted product is no longer visible in student catalog", !deletedFound);

        console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
        if (failed > 0) {
            process.exit(1);
        } else {
            console.log("🎉 ALL ROLE-BASED ACCESS CONTROL & FUNCTIONALITY TESTS PASSED!");
            process.exit(0);
        }
    } catch (err) {
        console.error("Test execution exception:", err);
        process.exit(1);
    }
}

runTests();
