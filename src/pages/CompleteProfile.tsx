import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiClient } from "../fetch/fetchClient";

const CompleteProfile = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { email, name, idToken } = state || {};

  const [form, setForm] = useState({
    name: name || "",
    email: email || "",
    age: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Validaciones
    if (!form.age) return setError("La edad es obligatoria.");
    if (form.password.length < 6) return setError("La contraseña debe tener mínimo 6 caracteres.");
    if (form.password !== form.confirmPassword)
      return setError("Las contraseñas no coinciden.");

    try {
      const payload = {
        age: Number(form.age),
      };
      

      const response = await apiClient.post(
        "/api/v1/users/complete-profile",
        payload,
        idToken // se manda para validar al usuario
      );

      console.log("Profile completed:", response);

      navigate("/dashboard"); // o a donde quieras
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al completar el perfil.");
    }
  };

  return (
    <div style={{ width: 300, margin: "auto", marginTop: 40 }}>
      <h2>Completa tu Perfil</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

        <label>Nombre</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Email</label>
        <input name="email" value={form.email} disabled />

        <label>Edad</label>
        <input name="age" value={form.age} onChange={handleChange} type="number" />

        <label>Contraseña</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />

        <label>Confirmar contraseña</label>
        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />

        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default CompleteProfile;
