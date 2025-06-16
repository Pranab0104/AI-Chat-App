import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state.project)
    const [message, setMessage] = useState('')
    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)
    const [runProcess, setRunProcess] = useState(null)
    const [showFileExplorer, setShowFileExplorer] = useState(true)
    const [showChat, setShowChat] = useState(true)

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }

    function addCollaborators() {
        axios.put("/projects/add-user", {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false)
        }).catch(err => {
            console.log(err)
        })
    }

    const send = () => {
        sendMessage('project-message', {
            message,
            sender: user
        })
        setMessages(prevMessages => [...prevMessages, { sender: user, message }])
        setMessage("")
    }

    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message)
        return (
            <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        )
    }

    useEffect(() => {
        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }

        receiveMessage('project-message', data => {
            console.log(data)
            
            if (data.sender._id == 'ai') {
                const message = JSON.parse(data.message)
                console.log(message)
                webContainer?.mount(message.fileTree)
                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
                setMessages(prevMessages => [...prevMessages, data])
            } else {
                setMessages(prevMessages => [...prevMessages, data])
            }
        })

        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            console.log(res.data.project)
            setProject(res.data.project)
            setFileTree(res.data.project.fileTree || {})
        })

        axios.get('/users/all').then(res => {
            setUsers(res.data.users)
        }).catch(err => {
            console.log(err)
        })
    }, [])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
            <div className="flex flex-col md:flex-row h-screen">
                {/* Mobile Navigation */}
                <div className="md:hidden flex justify-between items-center p-4 bg-white/10 border-b border-white/20">
                    <button 
                        className="text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowChat(!showChat)}
                    >
                        <i className={`ri-message-3-line ${showChat ? 'text-purple-500' : ''}`}></i>
                    </button>
                    <button 
                        className="text-gray-300 hover:text-white transition-colors"
                        onClick={() => setShowFileExplorer(!showFileExplorer)}
                    >
                        <i className={`ri-folder-line ${showFileExplorer ? 'text-purple-500' : ''}`}></i>
                    </button>
                </div>

                {/* Chat Panel */}
                <div className={`${showChat ? 'block' : 'hidden'} md:block w-full md:w-96 bg-white/10 border-r border-white/20 h-[calc(100vh-4rem)] md:h-screen`}>
                    <div className="flex justify-between items-center p-4 border-b border-white/20">
                        <button className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsModalOpen(true)}>
                            <i className="ri-add-fill mr-1"></i>
                            Add collaborator
                        </button>
                        <button className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>

                    <div className="h-[calc(100%-4rem)] flex flex-col">
                        <div ref={messageBox} className="flex-grow overflow-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`${msg.sender._id === 'ai' ? 'max-w-[80%]' : 'max-w-[60%]'} ${msg.sender._id == user._id.toString() ? 'ml-auto' : ''}`}>
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <div className="text-gray-400 text-sm mb-1">{msg.sender.email}</div>
                                        <div className="text-gray-200">
                                            {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : msg.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-white/20">
                            <div className="flex gap-2">
                                <input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-grow p-2 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Type a message..."
                                />
                                <button
                                    onClick={send}
                                    className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all"
                                >
                                    <i className="ri-send-plane-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-grow flex flex-col md:flex-row">
                    {/* File Explorer */}
                    <div className={`${showFileExplorer ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white/10 border-r border-white/20`}>
                        <div className="p-4">
                            {Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([...new Set([...openFiles, file])])
                                        // On mobile, switch to editor view after selecting file
                                        if (window.innerWidth < 768) {
                                            setShowFileExplorer(false)
                                        }
                                    }}
                                    className="w-full text-left p-2 text-gray-300 hover:bg-white/10 rounded transition-colors flex justify-between items-center"
                                >
                                    <span>{file}</span>
                                    <i 
                                        className="ri-close-line hover:text-red-500 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFileTree(prev => {
                                                const newTree = {...prev};
                                                delete newTree[file];
                                                return newTree;
                                            });
                                            setOpenFiles(openFiles.filter(f => f !== file));
                                            if (currentFile === file) {
                                                setCurrentFile(null);
                                            }
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col overflow-auto">
                        <div className="flex flex-wrap border-b border-white/20">
                            <div className="flex flex-wrap">
                                {openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`p-3 text-gray-300 ${currentFile === file ? 'bg-white/10' : ''} flex items-center gap-2`}
                                    >
                                        <span>{file}</span>
                                        <i 
                                            className="ri-close-line hover:text-red-500 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenFiles(openFiles.filter(f => f !== file));
                                                if (currentFile === file) {
                                                    setCurrentFile(null);
                                                }
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto p-2">
                                <button
                                    onClick={async () => {
                                        await webContainer.mount(fileTree)
                                        const installProcess = await webContainer.spawn("npm", ["install"])
                                        installProcess.output.pipeTo(new WritableStream({
                                            write(chunk) {
                                                console.log(chunk)
                                            }
                                        }))

                                        if (runProcess) {
                                            runProcess.kill()
                                        }

                                        let tempRunProcess = await webContainer.spawn("npm", ["start"]);
                                        tempRunProcess.output.pipeTo(new WritableStream({
                                            write(chunk) {
                                                console.log(chunk)
                                            }
                                        }))

                                        setRunProcess(tempRunProcess)

                                        webContainer.on('server-ready', (port, url) => {
                                            console.log(port, url)
                                            setIframeUrl(url)
                                        })
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition-all"
                                >
                                    Run
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col md:flex-row">
                            {fileTree[currentFile] && (
                                <div className="flex-grow bg-white/10 overflow-auto">
                                    <pre className="h-full">
                                        <code
                                            className="hljs h-full outline-none p-4 block text-gray-200 text-sm md:text-base"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [currentFile]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                };
                                                setFileTree(ft);
                                                saveFileTree(ft);
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight(currentFile.split('.').pop() || 'javascript', fileTree[currentFile].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )}

                            {iframeUrl && webContainer && (
                                <div className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-l border-white/20">
                                    <div className="p-2 border-b border-white/20">
                                        <input
                                            type="text"
                                            onChange={(e) => setIframeUrl(e.target.value)}
                                            value={iframeUrl}
                                            className="w-full p-2 rounded bg-white/10 text-white"
                                        />
                                    </div>
                                    <iframe src={iframeUrl} className="flex-grow min-h-[300px]" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-white/10 p-6 md:p-8 rounded-2xl w-full max-w-md border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Add Collaborators</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <i className="ri-close-fill text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[60vh] overflow-auto">
                            {users.map(user => (
                                <div
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className={`p-4 rounded-lg ${Array.from(selectedUserId).includes(user._id) ? 'bg-white/20' : 'bg-white/10'} cursor-pointer`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                            <i className="ri-user-fill text-white text-lg md:text-xl"></i>
                                        </div>
                                        <span className="text-gray-200 text-base md:text-lg">{user.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className="mt-6 w-full p-3 md:p-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base md:text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            Add Selected Collaborators
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Project