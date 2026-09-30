import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App.jsx'

import {
    registerAdmin,
    checkAdmin,
} from './service/admin.js'


const redirectPath = sessionStorage.getItem('redirectPath');

if (redirectPath) {
    sessionStorage.removeItem('redirectPath');
    window.history.replaceState(
        null,
        '',
        redirectPath
    );
}


// ---------------------------------
// ADMIN DEVTOOLS API
// ---------------------------------

window.registerAdmin = async (adminKey) => {
    try {
        const result = await registerAdmin(adminKey);

        console.log(
            '%cAdmin registration confirmed',
            'color: green; font-weight: bold;'
        );

        console.log(result);

        return result;

    } catch (error) {
        console.error(
            'Admin registration failed:',
            error.message
        );

        return null;
    }
};


window.checkAdmin = async () => {
    try {
        const isAdmin = await checkAdmin();

        if (isAdmin) {
            console.log(
                '%cYou are registered as admin',
                'color: green; font-weight: bold;'
            );
        } else {
            console.log(
                '%cYou are not an admin',
                'color: orange; font-weight: bold;'
            );
        }

        return isAdmin;

    } catch (error) {
        console.error(
            'Admin check failed:',
            error.message
        );

        return false;
    }
};


// ---------------------------------
// APP
// ---------------------------------

createRoot(
    document.getElementById('root')
).render(
    <StrictMode>
        <BrowserRouter basename="/">
            <App />
        </BrowserRouter>
    </StrictMode>,
)