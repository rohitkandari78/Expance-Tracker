# Smart Expense Tracker - Structured & Maintainable
 
A professional, well-organized expense tracking web application with clean separation of concerns.

<a href="https://expence-traker-min.netlify.app/login/login.html">Live Project Link here

## 📁 Project Structure

```
expense-tracker/
│
├── index.html                 # Entry point
│
├── login/                     # Login Module
│   ├── login.html            # Login page
│   ├── login.css             # Login-specific styles
│   └── login.js              # Login logic & authentication
│
├── dashboard/                 # Dashboard Module
│   ├── dashboard.html        # Main dashboard page
│   ├── dashboard.css         # Dashboard styles
│   └── dashboard.js          # Dashboard logic & features
│
├── js/                        # Shared JavaScript
│   ├── firebase-config.js    # Firebase configuration
│   └── classes.js            # OOP Classes (User, Expense, etc.)
│
├── assets/                    # Static assets
│   └── icons/                # Icon files (if needed)
│
└── README.md                  # This file
```

## ✨ Features

- ✅ **Google Authentication** - Secure Firebase auth
- ✅ **Budget Management** - Set and track monthly budgets
- ✅ **Expense Tracking** - Add, view, delete expenses
- ✅ **Month Navigation** - Browse previous/next months
- ✅ **Dynamic Dashboard** - Shows stats for viewing month
- ✅ **Split Expenses** - Share costs with friends
- ✅ **Auto-Login** - Stays logged in across sessions
- ✅ **Responsive Design** - Works on all devices


## 📊 Data Flow

```
Login Page
    ↓
Google Auth → Firebase
    ↓
Create/Update User Document
    ↓
Redirect to Dashboard
    ↓
Load User Data from Firestore
    ↓
Display Budget & Expenses
    ↓
User Actions (Add/Delete/Navigate)
    ↓
Update Firestore
    ↓
Refresh Dashboard
```

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full layout with all features
- **Tablet**: Optimized for medium screens
- **Mobile**: Stacked layout, touch-friendly

## 🔄 Future Enhancements

Ideas for extension:
- [ ] Charts and analytics (Chart.js)
- [ ] Export to CSV/PDF
- [ ] Recurring expenses
- [ ] Category-wise budgets
- [ ] Dark mode
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Multi-currency support

## 🤝 Contributing

Feel free to fork and modify this project and create pull requests!

---
