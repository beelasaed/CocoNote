// Centralized Data & Logic
const MockDB = {
    notes: JSON.parse(localStorage.getItem('notes')) || [
        { id: 1, title: "DBMS Normalization Guide", code: "CSE 3101", dept: "CSE", batch: "21", cat: "Lecture", upvotes: 45, downloads: 120, uploader: "Samiul Haque", description: "Comprehensive guide to 1NF, 2NF, and 3NF with IUT exam examples." },
        { id: 2, title: "Thermodynamics Past Paper", code: "ME 4201", dept: "ME", batch: "19", cat: "Past Paper", upvotes: 89, downloads: 340, uploader: "Anas Jawad", description: "Solved questions from Autumn 2019 semester final." },
        { id: 3, title: "Software Design Patterns", code: "SWE 4301", dept: "SWE", batch: "21", cat: "Slides", upvotes: 112, downloads: 500, uploader: "Fahim Ahmed", description: "Summary of Creational and Structural patterns." }
    ],
    currentUser: {
        name: "Test Student",
        id: "210041101",
        dept: "CSE",
        batch: "21",
        uploads: 12,
        coconuts: 450,
        rank: 4,
        badges: ["First Upload", "Top Contributor"]
    },
    leaderboard: [
        { name: "Samiul Haque", uploads: 45, votes: 230, downloads: 890, rank: 1 },
        { name: "Anas Jawad", uploads: 38, votes: 190, downloads: 700, rank: 2 },
        { name: "Fahim Ahmed", uploads: 30, votes: 150, downloads: 400, rank: 3 }
    ]
};

const CocoAPI = {
    // Get all notes or filter by department
    getNotes: (dept = "All") => {
        return dept === "All" ? MockDB.notes : MockDB.notes.filter(n => n.dept === dept);
    },

    // Find a specific note by ID
    getNoteById: (id) => MockDB.notes.find(n => n.id == id),

    // Simulate adding a note
    addNote: (noteData) => {
        const newNote = {
            id: Date.now(),
            upvotes: 0,
            downloads: 0,
            ...noteData
        };
        MockDB.notes.unshift(newNote);
        localStorage.setItem('notes', JSON.stringify(MockDB.notes));
        return newNote;
    },

    // Search logic
    searchNotes: (query) => {
        const q = query.toLowerCase();
        return MockDB.notes.filter(n => 
            n.title.toLowerCase().includes(q) || 
            n.code.toLowerCase().includes(q) || 
            n.batch.includes(q)
        );
    }
};