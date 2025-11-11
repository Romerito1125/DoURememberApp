import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/app/components/header'

describe('Header Component', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar el logo y nombre de la aplicación', () => {
      render(<Header />)

      expect(screen.getByText(/do u remember/i)).toBeInTheDocument()
      expect(screen.getByAltText(/do u remember logo/i)).toBeInTheDocument()
    })

    it('debe mostrar todos los links de navegación en desktop', () => {
      render(<Header />)

      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Nosotros')).toBeInTheDocument()
      expect(screen.getByText('Servicios')).toBeInTheDocument()
      expect(screen.getByText('Contacto')).toBeInTheDocument()
    })

    it('debe tener el header con clase sticky', () => {
      const { container } = render(<Header />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('sticky', 'top-0')
    })
  })

  describe('Navegación desktop', () => {
    it('debe tener links con href correctos', () => {
      render(<Header />)

      const inicioLink = screen.getByRole('link', { name: /inicio/i })
      const nosotrosLink = screen.getByRole('link', { name: /nosotros/i })
      const serviciosLink = screen.getByRole('link', { name: /servicios/i })
      const contactoLink = screen.getByRole('link', { name: /contacto/i })

      expect(inicioLink).toHaveAttribute('href', '/')
      expect(nosotrosLink).toHaveAttribute('href', '/about')
      expect(serviciosLink).toHaveAttribute('href', '/services')
      expect(contactoLink).toHaveAttribute('href', '/contact')
    })

    it('debe tener el logo como link al home', () => {
      render(<Header />)

      const logoLink = screen.getByRole('link', { name: /do u remember logo/i })
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('debe aplicar hover effects a los links', () => {
      render(<Header />)

      const link = screen.getByRole('link', { name: /nosotros/i })
      expect(link).toHaveClass('hover:text-purple-600')
    })
  })

  describe('Menú móvil', () => {
    it('debe mostrar el botón de menú hamburguesa', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      expect(menuButton).toBeInTheDocument()
    })

    it('debe abrir el menú móvil al hacer click en hamburguesa', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      
      // El menú debe estar cerrado inicialmente (max-h-0)
      const mobileNav = menuButton.parentElement?.parentElement?.querySelector('.md\\:hidden')
      expect(mobileNav).toHaveClass('max-h-0')

      // Abrir menú
      fireEvent.click(menuButton)

      // El menú debe abrirse (max-h-96)
      expect(mobileNav).toHaveClass('max-h-96')
    })

    it('debe cerrar el menú móvil al hacer click en un link', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      
      // Abrir menú
      fireEvent.click(menuButton)

      // Click en un link del menú móvil
      const mobileLinks = screen.getAllByRole('link', { name: /inicio/i })
      const mobileLink = mobileLinks.find(link => 
        link.parentElement?.parentElement?.classList.contains('px-6')
      )
      
      if (mobileLink) {
        fireEvent.click(mobileLink)

        // El menú debería cerrarse
        const mobileNav = menuButton.parentElement?.parentElement?.querySelector('.md\\:hidden')
        expect(mobileNav).toHaveClass('max-h-0')
      }
    })

    it('debe animar las barras del botón hamburguesa al abrir', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      
      // Las barras inicialmente no tienen rotación
      const spans = menuButton.querySelectorAll('span')
      expect(spans[0]).not.toHaveClass('rotate-45')

      // Abrir menú
      fireEvent.click(menuButton)

      // Las barras deben animarse
      expect(spans[0]).toHaveClass('rotate-45', 'translate-y-2')
      expect(spans[1]).toHaveClass('opacity-0')
      expect(spans[2]).toHaveClass('-rotate-45', '-translate-y-2')
    })

    it('debe alternar el menú al hacer múltiples clicks', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      const mobileNav = menuButton.parentElement?.parentElement?.querySelector('.md\\:hidden')

      // Cerrado inicialmente
      expect(mobileNav).toHaveClass('max-h-0')

      // Abrir
      fireEvent.click(menuButton)
      expect(mobileNav).toHaveClass('max-h-96')

      // Cerrar
      fireEvent.click(menuButton)
      expect(mobileNav).toHaveClass('max-h-0')

      // Abrir nuevamente
      fireEvent.click(menuButton)
      expect(mobileNav).toHaveClass('max-h-96')
    })
  })

  describe('Estilos y animaciones', () => {
    it('debe tener backdrop blur en el header', () => {
      const { container } = render(<Header />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('backdrop-blur-sm')
    })

    it('debe tener sombra en el header', () => {
      const { container } = render(<Header />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('shadow-sm')
    })

    it('debe tener transiciones en los links', () => {
      render(<Header />)

      const link = screen.getByRole('link', { name: /nosotros/i })
      expect(link).toHaveClass('transition-colors', 'duration-200')
    })

    it('debe mostrar underline animado en hover de links desktop', () => {
      render(<Header />)

      const link = screen.getByRole('link', { name: /servicios/i })
      const underline = link.querySelector('.absolute')

      expect(underline).toHaveClass('w-0', 'group-hover:w-full')
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener atributo aria-label en el botón de menú', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú')
    })

    it('debe tener roles correctos en los links de navegación', () => {
      render(<Header />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })

    it('debe tener alt text en el logo', () => {
      render(<Header />)

      const logo = screen.getByAltText(/do u remember logo/i)
      expect(logo).toBeInTheDocument()
    })
  })

  describe('Responsive design', () => {
    it('debe ocultar navegación desktop en móvil', () => {
      render(<Header />)

      const desktopNav = screen.getByRole('navigation', { hidden: true })
      expect(desktopNav).toHaveClass('hidden', 'md:flex')
    })

    it('debe mostrar botón hamburguesa solo en móvil', () => {
      render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      expect(menuButton).toHaveClass('md:hidden')
    })
  })

  describe('Branding', () => {
    it('debe mostrar el logo con prioridad de carga', () => {
      render(<Header />)

      const logo = screen.getByAltText(/do u remember logo/i)
      expect(logo).toHaveAttribute('priority')
    })

    it('debe tener el nombre de la app visible solo en pantallas sm+', () => {
      render(<Header />)

      const appName = screen.getByText(/do u remember/i)
      expect(appName).toHaveClass('hidden', 'sm:block')
    })

    it('debe tener el logo con fondo morado', () => {
      render(<Header />)

      const logoContainer = screen.getByAltText(/do u remember logo/i).parentElement
      expect(logoContainer).toHaveClass('bg-purple-50', 'rounded-lg')
    })
  })

  describe('Comportamiento de estado', () => {
    it('debe mantener el estado del menú independiente entre renderizados', () => {
      const { rerender } = render(<Header />)

      const menuButton = screen.getByLabelText(/abrir menú/i)
      
      // Abrir menú
      fireEvent.click(menuButton)

      // Re-renderizar
      rerender(<Header />)

      // El menú debe seguir abierto después del re-render
      const mobileNav = menuButton.parentElement?.parentElement?.querySelector('.md\\:hidden')
      expect(mobileNav).toHaveClass('max-h-96')
    })
  })

  describe('Integración', () => {
    it('debe funcionar correctamente con múltiples headers en la página', () => {
      const { container } = render(
        <>
          <Header />
          <Header />
        </>
      )

      const headers = container.querySelectorAll('header')
      expect(headers.length).toBe(2)

      // Ambos deben funcionar independientemente
      headers.forEach(header => {
        expect(header).toHaveClass('sticky', 'top-0')
      })
    })
  })
})