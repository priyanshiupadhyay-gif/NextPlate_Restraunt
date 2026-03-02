'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type Locale = 'en' | 'es' | 'fr' | 'hi'

interface I18nContextType {
    locale: Locale
    setLocale: (l: Locale) => void
    t: (key: string) => string
}

const translations: Record<Locale, Record<string, string>> = {
    en: {
        // Common
        'app.name': 'NextPlate',
        'app.tagline': 'Zero Waste Network',
        'nav.dashboard': 'Dashboard',
        'nav.orders': 'Orders',
        'nav.settings': 'Settings',
        'nav.community': 'Community',
        'nav.impact': 'Impact Stats',
        'nav.liveMap': 'Live Map',
        'nav.reviews': 'Reviews',
        'nav.logout': 'Logout',
        // Actions
        'action.save': 'Save Changes',
        'action.cancel': 'Cancel',
        'action.submit': 'Submit',
        'action.search': 'Search...',
        'action.export': 'Export CSV',
        'action.upload': 'Upload',
        'action.install': 'Install App',
        // Auth
        'auth.login': 'Sign In',
        'auth.register': 'Create Account',
        'auth.forgot': 'Forgot Password?',
        'auth.reset': 'Reset Password',
        'auth.email': 'Email Address',
        'auth.password': 'Password',
        // Status
        'status.placed': 'Placed',
        'status.confirmed': 'Confirmed',
        'status.preparing': 'Preparing',
        'status.ready': 'Ready',
        'status.completed': 'Completed',
        'status.cancelled': 'Cancelled',
        // Impact
        'impact.meals': 'Meals Rescued',
        'impact.carbon': 'CO₂ Saved',
        'impact.money': 'Money Saved',
        // Misc
        'misc.noData': 'No data available',
        'misc.loading': 'Loading...',
        'misc.error': 'Something went wrong',
    },
    es: {
        'app.name': 'NextPlate',
        'app.tagline': 'Red Basura Cero',
        'nav.dashboard': 'Panel',
        'nav.orders': 'Pedidos',
        'nav.settings': 'Ajustes',
        'nav.community': 'Comunidad',
        'nav.impact': 'Impacto',
        'nav.liveMap': 'Mapa en Vivo',
        'nav.reviews': 'Reseñas',
        'nav.logout': 'Cerrar Sesión',
        'action.save': 'Guardar Cambios',
        'action.cancel': 'Cancelar',
        'action.submit': 'Enviar',
        'action.search': 'Buscar...',
        'action.export': 'Exportar CSV',
        'action.upload': 'Subir',
        'action.install': 'Instalar App',
        'auth.login': 'Iniciar Sesión',
        'auth.register': 'Crear Cuenta',
        'auth.forgot': '¿Olvidaste tu contraseña?',
        'auth.reset': 'Restablecer Contraseña',
        'auth.email': 'Correo Electrónico',
        'auth.password': 'Contraseña',
        'status.placed': 'Realizado',
        'status.confirmed': 'Confirmado',
        'status.preparing': 'Preparando',
        'status.ready': 'Listo',
        'status.completed': 'Completado',
        'status.cancelled': 'Cancelado',
        'impact.meals': 'Comidas Rescatadas',
        'impact.carbon': 'CO₂ Ahorrado',
        'impact.money': 'Dinero Ahorrado',
        'misc.noData': 'Sin datos disponibles',
        'misc.loading': 'Cargando...',
        'misc.error': 'Algo salió mal',
    },
    fr: {
        'app.name': 'NextPlate',
        'app.tagline': 'Réseau Zéro Déchet',
        'nav.dashboard': 'Tableau de Bord',
        'nav.orders': 'Commandes',
        'nav.settings': 'Paramètres',
        'nav.community': 'Communauté',
        'nav.impact': 'Impact',
        'nav.liveMap': 'Carte en Direct',
        'nav.reviews': 'Avis',
        'nav.logout': 'Déconnexion',
        'action.save': 'Enregistrer',
        'action.cancel': 'Annuler',
        'action.submit': 'Soumettre',
        'action.search': 'Rechercher...',
        'action.export': 'Exporter CSV',
        'action.upload': 'Télécharger',
        'action.install': 'Installer l\'App',
        'auth.login': 'Se Connecter',
        'auth.register': 'Créer un Compte',
        'auth.forgot': 'Mot de passe oublié ?',
        'auth.reset': 'Réinitialiser le Mot de Passe',
        'auth.email': 'Adresse E-mail',
        'auth.password': 'Mot de Passe',
        'status.placed': 'Passée',
        'status.confirmed': 'Confirmée',
        'status.preparing': 'En Préparation',
        'status.ready': 'Prête',
        'status.completed': 'Terminée',
        'status.cancelled': 'Annulée',
        'impact.meals': 'Repas Sauvés',
        'impact.carbon': 'CO₂ Économisé',
        'impact.money': 'Argent Économisé',
        'misc.noData': 'Aucune donnée disponible',
        'misc.loading': 'Chargement...',
        'misc.error': 'Une erreur est survenue',
    },
    hi: {
        'app.name': 'NextPlate',
        'app.tagline': 'शून्य बर्बादी नेटवर्क',
        'nav.dashboard': 'डैशबोर्ड',
        'nav.orders': 'ऑर्डर',
        'nav.settings': 'सेटिंग्स',
        'nav.community': 'समुदाय',
        'nav.impact': 'प्रभाव',
        'nav.liveMap': 'लाइव मैप',
        'nav.reviews': 'समीक्षा',
        'nav.logout': 'लॉग आउट',
        'action.save': 'बदलाव सेव करें',
        'action.cancel': 'रद्द करें',
        'action.submit': 'जमा करें',
        'action.search': 'खोजें...',
        'action.export': 'CSV निर्यात',
        'action.upload': 'अपलोड',
        'action.install': 'ऐप इंस्टॉल करें',
        'auth.login': 'लॉग इन',
        'auth.register': 'खाता बनाएं',
        'auth.forgot': 'पासवर्ड भूल गए?',
        'auth.reset': 'पासवर्ड रीसेट',
        'auth.email': 'ईमेल पता',
        'auth.password': 'पासवर्ड',
        'status.placed': 'रखा गया',
        'status.confirmed': 'पुष्टि हुई',
        'status.preparing': 'तैयार हो रहा है',
        'status.ready': 'तैयार',
        'status.completed': 'पूरा हुआ',
        'status.cancelled': 'रद्द',
        'impact.meals': 'बचाए गए भोजन',
        'impact.carbon': 'CO₂ बचाया',
        'impact.money': 'पैसे बचाए',
        'misc.noData': 'कोई डेटा उपलब्ध नहीं',
        'misc.loading': 'लोड हो रहा है...',
        'misc.error': 'कुछ गलत हो गया',
    },
}

export const LOCALE_LABELS: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    hi: 'हिंदी',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    hi: '🇮🇳',
}

const I18nContext = createContext<I18nContextType>({
    locale: 'en',
    setLocale: () => { },
    t: (key) => key,
})

export const useI18n = () => useContext(I18nContext)

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en')

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l)
        if (typeof window !== 'undefined') {
            localStorage.setItem('nextplate-locale', l)
        }
    }, [])

    // Load stored locale on mount
    React.useEffect(() => {
        const stored = localStorage.getItem('nextplate-locale') as Locale
        if (stored && translations[stored]) {
            setLocaleState(stored)
        }
    }, [])

    const t = useCallback((key: string) => {
        return translations[locale]?.[key] || translations.en[key] || key
    }, [locale])

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    )
}
