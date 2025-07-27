import { useEffect, useState } from "react";
import { useLoginMutation, useGoogleAuthMutation } from "../../redux/apis/auth";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/user";
import { routes } from "../../constants/variables";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

const Login = () => {
  const [googleAuth] = useGoogleAuthMutation();
  const [login, { isError, error, data, isSuccess, isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login({ email: email, password: password });
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
      toast(e?.data?.message || "Error occurred with Google login");
    }
  };

  const handleError = () => {
    console.log("Login Failed");
    toast("Google login failed");
  };

  useEffect(() => {
    if (isError && error) {
      toast((error as any)?.data?.message || "Login failed");
    }
    if (isSuccess && data) {
      toast("Login Successfully");

      dispatch(
        setUser({
          name: data.data.user.name,
          email: data.data.user.email,
          profilePicture: data.data.user.profilePicture,
          id: data.data.user._id,
          _id: data.data.user._id,
          token: data.data.token,
        })
      );
      navigate(routes.dashboard);
    }
  }, [isError, isSuccess, error, data, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-[var(--color-appWhite)] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-[var(--color-primary)]">
          Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              isLoading ? "bg-gray-300" : "bg-[var(--color-primary)]"
            } text-white py-2 rounded-lg hover:bg-blue-600 transition`}
          >
            {isLoading ? "Logging in ...." : "Login"}
          </button>

          <button
            type="button"
            onClick={() => navigate(routes.signup)}
            disabled={isLoading}
            className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Sign up
          </button>
        </form>
        <div className="mt-4">
          <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>
    </div>
  );
};

export default Login;