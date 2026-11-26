const router = require("express").Router();
const c = require("../controllers/roomController");
const { getRoomReviews } = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");
const { validateId, validateRoom } = require("../middleware/validateRoom");

const hostOrAdmin = authorize("host", "admin");

router.get("/areas", c.getAreas);
router.get("/mine", protect, hostOrAdmin, c.getMyRooms);
router.get("/", c.getRooms);
router.get("/:id", validateId, c.getRoomById);
router.get("/:id/reviews", validateId, getRoomReviews);

router.post("/", protect, hostOrAdmin, validateRoom(false), c.createRoom);
router.put("/:id", protect, hostOrAdmin, validateId, validateRoom(true), c.updateRoom);
router.delete("/:id", protect, hostOrAdmin, validateId, c.deleteRoom);

module.exports = router;
