import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const Register = () => {
    const [ email, setEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    function submitHandler(e) {
        e.preventDefault()

        axios.post('/users/register', {
            email,
            password
        }).then((res) => {
            console.log(res.data)
            localStorage.setItem('token', res.data.token)
            setUser(res.data.user)
            navigate('/')
        }).catch((err) => {
            console.log(err.response.data)
            console.log(err);
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black">
            <div className="backdrop-blur-xl bg-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-float">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8 animate-pulse">Register</h2>
                <form
                    onSubmit={submitHandler}
                    className="space-y-6"
                >
                    <div className="transform transition-all duration-500 hover:scale-105">
                        <label className="block text-gray-300 text-lg mb-2" htmlFor="email">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            className="w-full p-4 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-800/70 transition-all duration-300"
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="transform transition-all duration-500 hover:scale-105">
                        <label className="block text-gray-300 text-lg mb-2" htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            className="w-full p-4 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-gray-800/70 transition-all duration-300"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full p-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transform transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
                    >
                        Join the Matrix
                    </button>
                </form>
                <p className="text-gray-400 mt-6 text-center text-lg">
                    Already have an account? <Link to="/login" className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 hover:opacity-80 transition-opacity duration-300">Login here</Link>
                </p>
            </div>
        </div>
    )
}

export default Register