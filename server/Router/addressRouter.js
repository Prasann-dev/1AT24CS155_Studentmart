const express = require("express");
const router = express.Router();
const Address = require("../Models/Address");
const { verifyToken } = require("../middleware/auth");

// Helper function to validate phone number
const isValidPhone = (phone) => {
    const cleaned = (phone || "").replace(/[\s-]/g, "");
    return /^[6-9]\d{9}$/.test(cleaned) || /^\+91[6-9]\d{9}$/.test(cleaned);
};

// Helper function to validate pincode
const isValidPincode = (pincode) => {
    return /^[1-9][0-9]{5}$/.test((pincode || "").trim());
};

// Helper function to validate email
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
};

// ==========================================
// 1. GET: Fetch all saved addresses of user
// ==========================================
router.get("/", verifyToken, async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
        res.json(addresses);
    } catch (error) {
        console.error("Fetch addresses error:", error);
        res.status(500).json({ message: "Failed to fetch addresses", error: error.message });
    }
});

// ==========================================
// 2. POST: Add a new delivery address
// ==========================================
router.post("/", verifyToken, async (req, res) => {
    try {
        const {
            fullName,
            mobile,
            email,
            houseNo,
            street,
            landmark,
            city,
            state,
            pincode,
            alternatePhone,
            isDefault
        } = req.body;

        // Validation
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: "Full name is required." });
        }
        if (!mobile || !isValidPhone(mobile)) {
            return res.status(400).json({ message: "Please provide a valid 10-digit mobile number." });
        }
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }
        if (!houseNo || !houseNo.trim()) {
            return res.status(400).json({ message: "House/Flat/Building number is required." });
        }
        if (!street || !street.trim()) {
            return res.status(400).json({ message: "Street/Area is required." });
        }
        if (!city || !city.trim()) {
            return res.status(400).json({ message: "City is required." });
        }
        if (!state || !state.trim()) {
            return res.status(400).json({ message: "State is required." });
        }
        if (!pincode || !isValidPincode(pincode)) {
            return res.status(400).json({ message: "Please provide a valid 6-digit PIN code." });
        }
        if (alternatePhone && alternatePhone.trim() && !isValidPhone(alternatePhone)) {
            return res.status(400).json({ message: "Please provide a valid 10-digit alternate phone number." });
        }

        const count = await Address.countDocuments({ user: req.user.id });
        const shouldBeDefault = isDefault || count === 0;

        if (shouldBeDefault) {
            await Address.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
        }

        const newAddress = new Address({
            user: req.user.id,
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            email: email.trim().toLowerCase(),
            houseNo: houseNo.trim(),
            street: street.trim(),
            landmark: (landmark || "").trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            alternatePhone: (alternatePhone || "").trim(),
            isDefault: shouldBeDefault
        });

        const saved = await newAddress.save();
        res.status(201).json(saved);
    } catch (error) {
        console.error("Add address error:", error);
        res.status(400).json({ message: error.message || "Failed to save address" });
    }
});

// ==========================================
// 3. PUT: Update an existing address
// ==========================================
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
        if (!address) {
            return res.status(404).json({ message: "Address not found." });
        }

        const {
            fullName,
            mobile,
            email,
            houseNo,
            street,
            landmark,
            city,
            state,
            pincode,
            alternatePhone,
            isDefault
        } = req.body;

        if (mobile && !isValidPhone(mobile)) {
            return res.status(400).json({ message: "Please provide a valid 10-digit mobile number." });
        }
        if (email && !isValidEmail(email)) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }
        if (pincode && !isValidPincode(pincode)) {
            return res.status(400).json({ message: "Please provide a valid 6-digit PIN code." });
        }
        if (alternatePhone && alternatePhone.trim() && !isValidPhone(alternatePhone)) {
            return res.status(400).json({ message: "Please provide a valid 10-digit alternate phone number." });
        }

        if (isDefault) {
            await Address.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
            address.isDefault = true;
        }

        if (fullName !== undefined) address.fullName = fullName.trim();
        if (mobile !== undefined) address.mobile = mobile.trim();
        if (email !== undefined) address.email = email.trim().toLowerCase();
        if (houseNo !== undefined) address.houseNo = houseNo.trim();
        if (street !== undefined) address.street = street.trim();
        if (landmark !== undefined) address.landmark = landmark.trim();
        if (city !== undefined) address.city = city.trim();
        if (state !== undefined) address.state = state.trim();
        if (pincode !== undefined) address.pincode = pincode.trim();
        if (alternatePhone !== undefined) address.alternatePhone = alternatePhone.trim();

        const updated = await address.save();
        res.json(updated);
    } catch (error) {
        console.error("Update address error:", error);
        res.status(400).json({ message: error.message || "Failed to update address" });
    }
});

// ==========================================
// 4. DELETE: Delete an address
// ==========================================
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!address) {
            return res.status(404).json({ message: "Address not found." });
        }

        // If deleted address was default, make another one default if exists
        if (address.isDefault) {
            const nextAddress = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        res.json({ message: "Address removed successfully.", id: req.params.id });
    } catch (error) {
        console.error("Delete address error:", error);
        res.status(500).json({ message: "Failed to delete address", error: error.message });
    }
});

// ==========================================
// 5. PUT: Set address as default
// ==========================================
router.put("/:id/default", verifyToken, async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
        if (!address) {
            return res.status(404).json({ message: "Address not found." });
        }

        await Address.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
        address.isDefault = true;
        const updated = await address.save();

        res.json({ message: "Default address updated.", address: updated });
    } catch (error) {
        console.error("Set default address error:", error);
        res.status(500).json({ message: "Failed to set default address", error: error.message });
    }
});

module.exports = router;
