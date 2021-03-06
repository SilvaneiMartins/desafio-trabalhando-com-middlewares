/*
 *   Nome: Silvanei de Almeida Martins;
 *   E-mail: silvaneimartins_rcc@hotmail.com;
 *   Contato Telegram: (69) 9.8405-2620;
 *   Frase: Estamos em constante mudança no aprendizado;
 *   Assinatura: Silvanei Martins;
 */
const express = require("express");
const cors = require("cors");

const { v4: uuidv4, validate } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;
    const userExists = users.some((user) => user.username === username);
    if (!userExists) {
        return response.status(404).json({ error: "Usuário não existe!" });
    }
    request.user = users.filter((user) => user.username === username)[0];
    return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
    const { user } = request;
    if ((!user.pro && user.todos.length < 10) || user.pro) {
        return next();
    }
    if (!user.pro && user.todos.length === 10) {
        return response.status(403).json({ error: "Ocorreu um erro" });
    }
}

function checksTodoExists(request, response, next) {
    const { username } = request.headers;
    const { id } = request.params;

    const user = users.filter((user) => user.username === username)[0];
    const todo = user?.todos.filter((todo) => todo.id === id)[0];

    const userExists = users.some((user) => user.username === username);
    const isUuid = validate(id);
    const isUserTodo = user?.todos.some((todo) => todo.id === id);

    console.log(user);
    console.log(todo);
    console.log(userExists);
    console.log(isUuid);
    console.log(isUserTodo);

    if (!isUuid) {
        return response
            .status(400)
            .json({ error: "Este id não é um UUID válido!" });
    }

    if (!userExists || !isUserTodo) {
        return response.status(404).json({ error: "Ocorreu um erro" });
    }

    if (userExists && isUuid && isUserTodo) {
        request.todo = todo;
        request.user = user;
        return next();
    }
}

function findUserById(request, response, next) {
    const { id } = request.params;
    const user = users.filter((user) => user.id === id)[0];
    if (user === undefined || !user) {
        return response.status(404).json({ error: "Ocorreu um erro" });
    }
    if (user) {
        request.user = user;
        return next();
    }
}

app.post("/users", (request, response) => {
    const { name, username } = request.body;
    const usernameAlreadyExists = users.some(
        (user) => user.username === username
    );
    if (usernameAlreadyExists) {
        return response
            .status(400)
            .json({ error: "Nome de usuário já existe!" });
    }
    const user = {
        id: uuidv4(),
        name,
        username,
        pro: false,
        todos: [],
    };
    users.push(user);
    return response.status(201).json(user);
});

app.get("/users/:id", findUserById, (request, response) => {
    const { user } = request;
    return response.json(user);
});

app.patch("/users/:id/pro", findUserById, (request, response) => {
    const { user } = request;

    if (user.pro) {
        return response
            .status(400)
            .json({ error: "O plano Pro já está ativado!" });
    }

    user.pro = true;

    return response.json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
    const { user } = request;
    return response.json(user.todos);
});

app.post(
    "/todos",
    checksExistsUserAccount,
    checksCreateTodosUserAvailability,
    (request, response) => {
        const { title, deadline } = request.body;
        const { user } = request;
        const newTodo = {
            id: uuidv4(),
            title,
            deadline: new Date(deadline),
            done: false,
            created_at: new Date(),
        };
        user.todos.push(newTodo);
        return response.status(201).json(newTodo);
    }
);

app.put("/todos/:id", checksTodoExists, (request, response) => {
    const { title, deadline } = request.body;
    const { todo } = request;
    todo.title = title;
    todo.deadline = new Date(deadline);
    return response.json(todo);
});

app.patch("/todos/:id/done", checksTodoExists, (request, response) => {
    const { todo } = request;
    todo.done = true;
    return response.json(todo);
});

app.delete(
    "/todos/:id",
    checksExistsUserAccount,
    checksTodoExists,
    (request, response) => {
        const { user, todo } = request;
        const todoIndex = user.todos.indexOf(todo);
        if (todoIndex === -1) {
            return response.status(404).json({ error: "Todo não encontrado!" });
        }
        user.todos.splice(todoIndex, 1);
        return response.status(204).send();
    }
);

module.exports = {
    app,
    users,
    checksExistsUserAccount,
    checksCreateTodosUserAvailability,
    checksTodoExists,
    findUserById,
};
