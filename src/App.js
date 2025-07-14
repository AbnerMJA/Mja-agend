
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { v4 as uuidv4 } from "uuid";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDuPh7aFHJSA1MiqtpG7LIGvZMFuG30pgU",
  authDomain: "mja-agenda.firebaseapp.com",
  databaseURL: "https://mja-agenda-default-rtdb.firebaseio.com",
  projectId: "mja-agenda",
  storageBucket: "mja-agenda.firebasestorage.app",
  messagingSenderId: "1042781051715",
  appId: "1:1042781051715:web:63dadcf10a04ca430aedf6",
  measurementId: "G-YB2LJES8CF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App = () => {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState({});
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    servico: "",
    duracao: "",
    endereco: "",
    autor: "",
    horario: ""
  });

  const dateKey = date.toDateString();

  useEffect(() => {
    const dbRef = ref(db);
    get(child(dbRef, `agendamentos/${dateKey}`)).then((snapshot) => {
      if (snapshot.exists()) {
        setAppointments((prev) => ({ ...prev, [dateKey]: snapshot.val() }));
      } else {
        setAppointments((prev) => ({ ...prev, [dateKey]: [] }));
      }
    });
  }, [dateKey]);

  const parseTime = (str) => {
    if (!str || !str.includes(":")) return 0;
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleAdd = async () => {
  if (!formData.horario || !formData.duracao) {
    alert("Preencha horário e duração antes de agendar.");
    return;
  }

  const novaHora = parseTime(formData.horario);
  const novaFim = novaHora + parseInt(formData.duracao);

  // Lê os agendamentos diretamente do banco em tempo real
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `agendamentos/${dateKey}`));
  const existentes = snapshot.exists() ? snapshot.val() : [];

  let conflitos = 0;
  for (const ag of existentes) {
    const agInicio = parseTime(ag.horario);
    const agFim = agInicio + parseInt(ag.duracao || 0);
    if (!(novaFim <= agInicio || novaHora >= agFim)) {
      conflitos++;
    }
  }

  if (conflitos >= 3) {
    alert("Limite de 3 agendamentos sobrepostos atingido.");
    return;
  }

  const novaEntrada = { ...formData, id: uuidv4() };
  const atualizados = [...existentes, novaEntrada];
  await set(ref(db, `agendamentos/${dateKey}`), atualizados);
  setAppointments((prev) => ({ ...prev, [dateKey]: atualizados }));
};

  const handleDelete = (id) => {
    const filtrados = (appointments[dateKey] || []).filter((a) => a.id !== id);
    set(ref(db, `agendamentos/${dateKey}`), filtrados);
    setAppointments({ ...appointments, [dateKey]: filtrados });
  };

  const agendaDia = appointments[dateKey] || [];
  const turnoManha = agendaDia.filter((a) => parseTime(a.horario) < 720);
  const turnoTarde = agendaDia.filter((a) => parseTime(a.horario) >= 720);

  const containerStyle = {
    padding: 16,
    fontFamily: "Arial",
    maxWidth: 600,
    margin: "0 auto",
    backgroundColor: "#0d1b2a",
    color: "#fff",
    minHeight: "100vh"
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    border: "1px solid #ccc",
    backgroundColor: "#1b263b",
    color: "#fff"
  };

  const cardStyle = {
    background: "#1b263b",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img src="https://i.imgur.com/pNHdRxY.png" alt="Logo MJA" style={{ maxWidth: 120 }} />
        <h2 style={{ color: "#61dafb" }}>MJA Agenda</h2>
        <p style={{ fontSize: 14 }}>Montagem de Móveis</p>
      </div>

      <Calendar onChange={setDate} value={date} />

      <div style={{ marginTop: 20 }}>
        <h3>Novo agendamento</h3>
        {Object.keys(formData).map((campo) => (
          <input
            key={campo}
            name={campo}
            placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
            onChange={handleChange}
            style={inputStyle}
          />
        ))}
        <button onClick={handleAdd} style={{ width: "100%", padding: 12, background: "#007bff", color: "#fff", border: "none", borderRadius: 4 }}>Agendar</button>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Agendamentos em {date.toDateString()}</h3>

        <div style={{ marginTop: 16 }}>
          <strong>☀️ Turno da Manhã</strong>
          {turnoManha.length === 0 ? <p style={{ fontSize: 14 }}>Nenhum agendamento</p> : turnoManha.map((a) => (
            <div key={a.id} style={cardStyle}>
              <strong>{a.nome}</strong> ({a.autor})<br />
              {a.servico} às {a.horario} - {a.duracao} min<br />
              {a.telefone}<br />
              {a.endereco}
              <button onClick={() => handleDelete(a.id)} style={{ float: "right", background: "#dc3545", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}>Excluir</button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <strong>🌙 Turno da Tarde</strong>
          {turnoTarde.length === 0 ? <p style={{ fontSize: 14 }}>Nenhum agendamento</p> : turnoTarde.map((a) => (
            <div key={a.id} style={cardStyle}>
              <strong>{a.nome}</strong> ({a.autor})<br />
              {a.servico} às {a.horario} - {a.duracao} min<br />
              {a.telefone}<br />
              {a.endereco}
              <button onClick={() => handleDelete(a.id)} style={{ float: "right", background: "#dc3545", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 12 }}>Excluir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
