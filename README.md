
# 📚 the fic shelf

**The fic shelf** is an open-source web app for tracking fanfiction reading progress. Whether you're juggling 10 WIPs or just trying to remember where you left off, Ficshelf helps you stay organized, track your stats, and rediscover your favorite stories.

[![Live Site](https://img.shields.io/badge/Live%20Site-theficshelf.app-blueviolet)](https://theficshelf.app)  

---

### ✨ Features

- 📖 Track your fanfiction reading progress (TBR, Currently Reading, Finished)
- 🔖 Sort fics into custom shelves with a flexible tagging system
- 🔍 Filter and search through your shelves and fics with ease
- 📝 Add fics manually — no scraping, respecting AO3's Terms of Service
- 🧾 View monthly reading analytics and all-time word count on your profile
- 🧡 Follow other users and see a feed of what they’re reading
- 📱 Fully responsive design for both mobile and desktop
- 🛠️ Actively in development with more features on the way!

---

### 🚀 Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend/Database:** Supabase (PostgreSQL, Auth)
- **Hosting:** Vercel
- **Version Control:** Git + GitHub

---

### 📸 Screenshots

![Bookshelf](https://cdn.discordapp.com/attachments/1110641903038374001/1381111569055879168/image.png?ex=68484e21&is=6846fca1&hm=7f8afd98a9754504b3c13522ce0764168741d9511496b618713230f0825ff0f7&)
![Fic logging](https://cdn.discordapp.com/attachments/1110641903038374001/1381112330871373934/image.png?ex=68484ed7&is=6846fd57&hm=9a9ef82035fbaab27f8febc222b50f03f700e433374057cea22b3a6a514abda5&)
![Feed](https://cdn.discordapp.com/attachments/1110641903038374001/1381112664671129721/image.png?ex=68484f27&is=6846fda7&hm=8ad8322999c1d784556fe2783ed4b6461ba8936920ddfbc2f17d104917e21548&)

![Shelf page](https://cdn.discordapp.com/attachments/1110641903038374001/1381111729039212584/image.png?ex=68484e48&is=6846fcc8&hm=f5d75ba6185b1323c5bb2b97a686e7af90c3e311b7df6d52c18f4d1c5e81fe45&)
![Fic page](https://cdn.discordapp.com/attachments/1110641903038374001/1381112062788243466/image.png?ex=68484e97&is=6846fd17&hm=c8f4a6d8fa4545149cb879d51bc2ee04915f48c689d107f253d87418ac24cfac&)
![Monthly Analytics](https://cdn.discordapp.com/attachments/1110641903038374001/1381112809999433728/image.png?ex=68484f49&is=6846fdc9&hm=8910ac6ba41342863fbb2a700ed8c54b961a88194236423faa1d860e9941597f&)

---

### 🛠️ Installation

To run locally:

```bash
git clone https://github.com/yourusername/theficshelf-app.git
cd theficshelf-app
npm install
npm run dev
```

Make sure you create a `.env` file with your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

### 🧪 Roadmap

✅ Completed
- ✅ User authentication with Supabase
- ✅ Bookmark tracking
- ✅ Reading analytics dashboard
- ✅ Tag filters and filtered search
- ✅ Export reading data

🛠️ In Progress / Planned
- 🎨 New themes to enhance user UI customization
- 🖼️ Add photo banners to shelves
- 🏅 Reading achievement badges (e.g. total words read)

---

### 📝 License

This project is licensed under the [MIT License](./LICENSE).

---

### 🙋‍♀️ About the Developer

Hi! I'm [Kelsey Nichols](https://www.linkedin.com/in/kelseydianenichols/), a cybersecurity graduate and junior developer building open-source tools for online communities. **The fic shelf** started as a side project to combine my love of fanfiction and web development. I have been reading and writing fanfiction for 15 years and every once in a while a tool comes along for tracking fanfiction but I've always found it lacking. This app is my response. **The fic shelf** is fully compliant with AO3's terms of service and takes into account the concerns many have over third party apps used for tracking fan written works. Come along with me as I continue developing and improving this app!

