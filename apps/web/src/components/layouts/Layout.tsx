import { Outlet } from 'react-router-dom';

export default function Layout() {


    return (
        <div className="app-layout">
            <header>Navbar</header>

            <main><Outlet /></main>

            <footer>Footer</footer>
        </div>
    );
}