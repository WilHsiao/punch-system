// @/components/navigation.jsx

import React from 'react'

const navigation = () => {
    return (
        <>
            <div className='fixed left-0 top-0 w-64 h-screen p-4 bg-white border-r-2 border-blue-600 flex flex-col justify-between shadow-lg'>
                {/* Add navigation items here */}
                <nav>
                    <ul>
                        <li><a href="#dashboard" className="block py-2 px-4 hover:bg-blue-50">Dashboard</a></li>
                        <li><a href="#reports" className="block py-2 px-4 hover:bg-blue-50">Reports</a></li>
                        <li><a href="#settings" className="block py-2 px-4 hover:bg-blue-50">Settings</a></li>
                    </ul>
                </nav>
            </div>
            <div className='ml-64 p-4 flex justify-between'>
                <h2>Dashboard</h2>
                <h2>Dashboard</h2>
            </div>
        </>
    )
}

export default navigation
