import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../panels/Footer';
import Timer from '../timer/Timer';
import '../panels/footer.css';
import Box from '../ui/box/Box';

export default function Layout() {

    const { pathname } = useLocation();
    const isWorkoutPage = pathname === "/workout";


    return (
        <div className="app-layout">
            <header>Navbar</header>

            <main><Outlet /></main>
            {isWorkoutPage ? (
                <Footer
                    className="timer-footer"
                >
                    <Box
                        className="timer-box"
                    >
                        <Timer />
                    </Box>
                </Footer>
            ) :
                <Footer>Footer</Footer>
            }
        </div>
    );
}