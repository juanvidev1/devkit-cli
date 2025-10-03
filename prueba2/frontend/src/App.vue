<template>
  <div style="padding: 24px">
    <h1>Express + Vue (CRUD + JWT)</h1>
    <div v-if="!token">
      <h2>Login</h2>
      <form @submit.prevent="doLogin">
        <input v-model="username" placeholder="Usuario" />
        <input v-model="password" type="password" placeholder="Contraseña" />
        <button>Entrar</button>
      </form>
      <p v-if="loginError" style="color: red">Login incorrecto</p>
    </div>
    <div v-else>
      <button @click="logout">Cerrar sesión</button>
      <h2>Items</h2>
      <form @submit.prevent="addItem">
        <input v-model="newItem.name" placeholder="Nombre" />
        <input v-model="newItem.description" placeholder="Descripción" />
        <button>Agregar</button>
      </form>
      <ul>
        <li v-for="item in items" :key="item.id">
          <b>{{ item.name }}</b
          >: {{ item.description }}
        </li>
      </ul>
      <h2>Ruta protegida</h2>
      <button @click="getMeLocal">Ver usuario actual</button>
      <div v-if="me">Usuario: {{ me.username }}</div>
      <div v-if="meError" style="color: red">No autorizado</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { login, getItems, createItem, getMe } from "./api";

const username = ref("demo");
const password = ref("password");
const token = ref(localStorage.getItem("token") || "");
const loginError = ref(false);
const items = ref([]);
const newItem = ref({ name: "", description: "" });
const me = ref(null);
const meError = ref(false);

async function doLogin() {
  try {
    const res = await login(username.value, password.value);
    token.value = res.access_token;
    localStorage.setItem("token", token.value);
    loginError.value = false;
    await fetchItems();
  } catch {
    loginError.value = true;
  }
}

function logout() {
  token.value = "";
  localStorage.removeItem("token");
  me.value = null;
}

async function fetchItems() {
  try {
    items.value = await getItems(token.value);
  } catch {}
}

async function addItem() {
  if (!newItem.value.name) return;
  await createItem(newItem.value, token.value);
  newItem.value = { name: "", description: "" };
  await fetchItems();
}

async function getMeLocal() {
  try {
    me.value = await getMe(token.value);
    meError.value = false;
  } catch {
    me.value = null;
    meError.value = true;
  }
}

onMounted(() => {
  if (token.value) fetchItems();
});
</script>

<style>
h1 {
  color: #42b983;
}
</style>
