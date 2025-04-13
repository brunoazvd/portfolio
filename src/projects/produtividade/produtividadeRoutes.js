import { Router } from 'express';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definindo o caminho para o arquivo JSON que armazenará as tarefas
const dataFilePath = path.join(__dirname, 'data', 'tasks.json');

const produtividadeRoutes = Router();

// Middleware para processar JSON no corpo das requisições
produtividadeRoutes.use(express.json());

// Servir arquivos estáticos da pasta build
produtividadeRoutes.use("/", express.static(path.join(__dirname, "build")));

// Helper function to read/write JSON file
async function readTasks() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist
    return [];
  }
}

async function writeTasks(tasks) {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(tasks, null, 2));
}

// API routes
produtividadeRoutes.get('/api/get-tasks', async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

produtividadeRoutes.post('/api/add-task', async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTask = req.body;
    tasks.push(newTask);
    await writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

produtividadeRoutes.delete('/api/delete-task/:id', async (req, res) => {
  try {
    const tasks = await readTasks();
    const filteredTasks = tasks.filter(task => task.id !== req.params.id);
    await writeTasks(filteredTasks);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

produtividadeRoutes.put("/api/update-task", async (req, res) => {
  try {
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex(task => task.id === req.body.id);
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }
    tasks[taskIndex] = req.body;
    await writeTasks(tasks);
    res.status(200).json({ success: true });
  }  catch (error) {
    res.status(500).json({ error: error.message });
  }
})

export default produtividadeRoutes;
