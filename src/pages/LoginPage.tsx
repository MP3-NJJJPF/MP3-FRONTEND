import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../services/auth.service";
import { apiClient } from "../fetch/fetchClient";

const Login = () => {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // 1. Login con Google (frontend)
      const { idToken, user } = await loginWithGoogle();

      // 2. Enviar token al backend
      const data = await apiClient.post("/api/v1/users/google", {}, idToken);

      console.log("Response:", data, user);

      // 3. Si el perfil está incompleto → ir al formulario
      if (data.status === "incomplete_profile") {
        return navigate("/complete-profile", {
          state: {
            email: data.email,
            googleUid: data.googleUid,
            name: user.displayName,
            idToken,
          },
        });
      }

      // 4. Caso normal → home u otra página
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  };

  return (
    <button onClick={handleGoogleLogin}>
      Login con Google
    </button>
  );
};

export default Login;
