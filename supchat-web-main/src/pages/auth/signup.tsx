// supchat-web-main/src/pages/auth/signup.tsx
import { useEffect, useState } from "react";
import { uploadToCloudinary } from "../../../script/cloudinaryUpload";
import { toast } from "react-toastify";
import {
  useSignupMutation,
  useGoogleAuthMutation,
} from "../../redux/apis/auth";
import { routes } from "../../constants/variables";
import { useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/user";

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const SignUp = () => {
  const [googleAuth] = useGoogleAuthMutation();
  const dispatch = useDispatch();
  const [selectedImage, setSelectedImage] = useState("");
  const [imageFile, setIMageFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const [signup, { isLoading, error, isError, isSuccess }] = useSignupMutation();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setIMageFile(file);
    }
  };

  const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) {
      toast("No credential received from Google");
      return;
    }

    try {
      const response = await googleAuth({
        token: credentialResponse.credential,
      }).unwrap();

      if (response?.data?.status === "success") {
        dispatch(
          setUser({
            name: response.data.data.user.name,
            email: response.data.data.user.email,
            profilePicture: response.data.data.user.profilePicture,
            id: response.data.data.user._id,
            _id: response.data.data.user._id,
            token: response.data.data.token,
          })
        );
        navigate(routes.dashboard);
      }
    } catch (e: any) {
      toast(e?.data?.message || "Error occurred signing up");
    }
  };

  const handleError = () => {
    console.log("Login Failed");
    toast("Google signup failed");
  };

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (form.password !== form.confirmPassword) {
      toast("Passwords do not match");
      return;
    }
    
    if (!imageFile) {
      toast("Please select a profile image");
      return;
    }

    const profileURL = await uploadToCloudinary(imageFile);

    if (!profileURL) {
      toast("Error occurred uploading image");
      return;
    }
    
    signup({
      name: form.name,
      email: form.email,
      password: form.password,
      profilePicture: profileURL,
    });
  };

  useEffect(() => {
    if (isError && error) {
      toast((error as any)?.data?.message || "Signup failed");
    }
    if (isSuccess) {
      toast("Sign up Successfully");
      navigate(routes.login);
    }
  }, [isError, isSuccess, error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-[var(--color-appWhite)] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--color-primary)]">
          Sign Up
        </h2>
        <div className="flex flex-col items-center justify-center space-y-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="rounded-[50px] h-20 w-20 bg-gray-400 flex items-center justify-center overflow-hidden">
              {selectedImage === "" ? (
                <FaCamera />
              ) : (
                <img
                  src={selectedImage}
                  className="h-20 w-20 object-cover"
                  alt="Profile preview"
                />
              )}
            </div>
          </label>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email address"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              isLoading ? "bg-gray-300" : "bg-[var(--color-primary)]"
            } text-white py-2 rounded-lg hover:bg-blue-600 transition`}
          >
            {isLoading ? "Signing up ...." : "Sign Up"}
          </button>
          <button
            type="button"
            onClick={() => navigate(routes.login)}
            disabled={isLoading}
            className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
        <div className="mt-4">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            text="signup_with"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;