import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState(null)
    const [ project, setProject ] = useState([])

    const navigate = useNavigate()

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        axios.post('/projects/create', {
            name: projectName,
        })
            .then((res) => {
                console.log(res)
                setIsModalOpen(false)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    useEffect(() => {
        axios.get('/projects/all').then((res) => {
            setProject(res.data.projects)

        }).catch(err => {
            console.log(err)
        })

    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-black p-8 rounded-lg shadow-xl w-full max-w-4xl">
                <h1 className="text-3xl font-bold text-white mb-8 text-center">Your Projects</h1>
                
                <div className="projects flex flex-wrap gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="project p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-500 text-gray-400 transition-all">
                        New Project
                        <i className="ri-link ml-2"></i>
                    </button>

                    {
                        project.map((project) => (
                            <div key={project._id}
                                onClick={() => {
                                    navigate(`/project`, {
                                        state: { project }
                                    })
                                }}
                                className="project flex flex-col gap-3 cursor-pointer p-6 bg-gradient-to-br from-purple-900 via-gray-900 to-black border border-gray-700 rounded-lg min-w-64 hover:bg-[#2D3B4F] transition-all">
                                <h2
                                    className='text-xl font-bold text-white'
                                >{project.name}</h2>

                                <div className="flex items-center gap-2 text-gray-400">
                                    <p><i className="ri-user-line"></i> Collaborators:</p>
                                    <span className="font-medium">{project.users.length}</span>
                                </div>

                            </div>
                        ))
                    }
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-60">
                        <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-black p-8 rounded-lg shadow-2xl w-full max-w-md">
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
                            <form onSubmit={createProject} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Project Name</label>
                                    <input
                                        onChange={(e) => setProjectName(e.target.value)}
                                        value={projectName}
                                        type="text" 
                                        className="w-full p-3 bg-[#2D3B4F] text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                        required 
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all" 
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Home