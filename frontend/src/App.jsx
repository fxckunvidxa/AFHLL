import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/auth'
import Layout from './components/Layout'
import Gallery from './pages/Gallery'
import Login from './pages/Login'
import Register from './pages/Register'
import ItemDetails from './pages/ItemDetails'
import ItemCreate from './pages/ItemCreate'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Gallery />}>
              <Route path="item/:id" element={<ItemDetails />} />
              <Route path="create" element={<ItemCreate />} />
            </Route>
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App