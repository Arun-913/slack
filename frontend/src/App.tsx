import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'; 
import { Landing1 } from './pages/Landing1';
import { Landing2 } from './pages/Landing2';
import { Header } from './components/Header';
import { WorkspaceSetup } from './pages/WorkspaceSetup';
import { WorkspaceMaster } from './pages/WorkspaceMaster';
import { Signin } from './pages/Signin';
import { Join } from './pages/Join';

function App() {
    return (
        <BrowserRouter>
            {/* <Header /> */}
            <HeaderWithLocation />
            <Routes>
                <Route path="/" element={<Landing2 />} />
                <Route path="/temp" element={<Landing1 />} />
                <Route path="/workspace" element={<WorkspaceSetup />} />
                <Route path="/workspace/:workspaceId/:chatId" element={<WorkspaceMaster />} />
                <Route path="/join/:token" element={<Join />} />
                <Route path="/signin" element={<Signin />} />
            </Routes>
        </BrowserRouter>
    )
}

function HeaderWithLocation() {
    const location = useLocation();
    if(location.pathname === '/') {
        return <Header />
    }
    else if(location.pathname === '/temp') {
        return <Header signin={true} />
    }
    return <></>;
} 

export default App
