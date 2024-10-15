import { Router } from "express";
import {
  updateUserProfile,
  getAllUsers,
  getUserById,
  // updateUser,
  deleteUser,
  delUser,
  registerUser,
  loginUser,
  updateUser,
  deleteCoTraveller,
  changePassword,
  socialAuthRegister,
  resetPassword,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authmiddleware";
import {
  addPassenger,
  deletePassenger,
  updatePassenger,
} from "../controllers/passengerController";
import {
  addCoTraveller,
  AddFrequentFlyer,
  UpdatePassportDetail,
} from "../controllers/CoTravellerController";

const router = Router();
router.post("/register", registerUser);
router.post("/social", socialAuthRegister);
router.post("/login", loginUser);

// Protected Routes
router.get("/profile", authenticateToken, getUserById);
router.post("/profile", authenticateToken, updateUser);
router.post("/update-password", authenticateToken, changePassword);
router.post("/allprofile", authenticateToken, updateUser);
router.post("/traveller", authenticateToken, addCoTraveller);
router.post("/del-traveller", authenticateToken, deleteCoTraveller);
router.post("/passport", authenticateToken, UpdatePassportDetail);
router.post("/flyer", authenticateToken, AddFrequentFlyer);
router.get("/", getAllUsers);
router.get("/:id", authenticateToken, getUserById);

// router.put('/:id', authenticateToken, updateUser);
router.post("/delete-user", authenticateToken, deleteUser);
router.post("/del-user", delUser);
router.post("/addPassenger", authenticateToken, addPassenger);
router.post("/deletePassenger/:id", authenticateToken, deletePassenger);
router.post("/updatePassenger/:id", authenticateToken, updatePassenger);

export default router;
