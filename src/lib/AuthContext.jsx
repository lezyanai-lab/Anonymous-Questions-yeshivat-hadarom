import React, { createContext, useContext } from 'react';
const AuthContext = createContext();
export const AuthProvider = ({children}) => <AuthContext.Provider value={{user: null, isAuthenticated: false}}>{children}</AuthContext.Provider>;
export const useAuth = () => useContext(AuthContext);