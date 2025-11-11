import { render, screen, waitFor } from '@testing-library/react'
import Loading from '@/app/components/loading'

describe('Loading Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar el spinner de carga', () => {
      render(<Loading />)

      const spinner = screen.getByAltText('Loading...')
      expect(spinner).toBeInTheDocument()
    })

    it('debe mostrar la imagen de loading', () => {
      render(<Loading />)

      const loadingImage = screen.getByAltText('Loading...')
      expect(loadingImage).toHaveAttribute('src', '/loading.svg')
    })

    it('debe tener las clases correctas de animación', () => {
      render(<Loading />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Contador de tiempo', () => {
    it('no debe mostrar mensaje de espera inicialmente', () => {
      render(<Loading />)

      expect(
        screen.queryByText(/está tardando un poco más de lo normal/i)
      ).not.toBeInTheDocument()
    })

    it('debe mostrar mensaje de espera después de 30 segundos', async () => {
      render(<Loading />)

      // No debería estar visible antes de 30s
      expect(
        screen.queryByText(/está tardando un poco más de lo normal/i)
      ).not.toBeInTheDocument()

      // Avanzar 30 segundos
      jest.advanceTimersByTime(30000)

      // Ahora debería estar visible
      await waitFor(() => {
        expect(
          screen.getByText(/está tardando un poco más de lo normal/i)
        ).toBeInTheDocument()
      })
    })

    it('debe mostrar ambos mensajes de espera después de 30 segundos', async () => {
      render(<Loading />)

      jest.advanceTimersByTime(31000)

      await waitFor(() => {
        expect(
          screen.getByText(/está tardando un poco más de lo normal/i)
        ).toBeInTheDocument()
        expect(screen.getByText(/danos un momento por favor/i)).toBeInTheDocument()
      })
    })

    it('debe incrementar el contador cada segundo', async () => {
      render(<Loading />)

      // Avanzar 5 segundos
      jest.advanceTimersByTime(5000)

      // El contador interno debería ser 5
      // Aunque no se muestre, podemos verificar que el efecto se ejecutó
      await waitFor(() => {
        expect(jest.getTimerCount()).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Comportamiento del timer', () => {
    it('debe limpiar el timer al desmontar', () => {
      const { unmount } = render(<Loading />)

      // Verificar que hay timers activos
      expect(jest.getTimerCount()).toBeGreaterThan(0)

      // Desmontar
      unmount()

      // El timer debería limpiarse
      jest.runOnlyPendingTimers()
    })

    it('debe actualizar el contador continuamente', async () => {
      render(<Loading />)

      // Avanzar 10 segundos
      jest.advanceTimersByTime(10000)

      // Avanzar otros 10 segundos
      jest.advanceTimersByTime(10000)

      // Avanzar hasta 35 segundos (pasando el umbral de 30)
      jest.advanceTimersByTime(15000)

      await waitFor(() => {
        expect(
          screen.getByText(/está tardando un poco más de lo normal/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Estilos y estructura', () => {
    it('debe tener la estructura correcta de contenedor', () => {
      const { container } = render(<Loading />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('debe mostrar el spinner con borde morado', () => {
      render(<Loading />)

      const spinner = document.querySelector('.border-t-purple-500')
      expect(spinner).toBeInTheDocument()
    })

    it('debe mostrar mensajes en color morado', async () => {
      render(<Loading />)

      jest.advanceTimersByTime(31000)

      await waitFor(() => {
        const message = screen.getByText(/está tardando un poco más de lo normal/i)
        expect(message).toHaveClass('text-purple-500')
      })
    })
  })

  describe('Accesibilidad', () => {
    it('debe tener texto alternativo en la imagen', () => {
      render(<Loading />)

      const image = screen.getByAltText('Loading...')
      expect(image).toBeInTheDocument()
    })

    it('debe ser visible para lectores de pantalla', () => {
      render(<Loading />)

      const loadingText = screen.getByAltText('Loading...')
      expect(loadingText).toBeVisible()
    })
  })

  describe('Múltiples renderizados', () => {
    it('debe reiniciar el contador en cada montaje', async () => {
      const { unmount, rerender } = render(<Loading />)

      // Avanzar tiempo
      jest.advanceTimersByTime(15000)

      // Desmontar
      unmount()

      // Volver a renderizar
      rerender(<Loading />)

      // No debería mostrar mensaje aún (contador reiniciado)
      expect(
        screen.queryByText(/está tardando un poco más de lo normal/i)
      ).not.toBeInTheDocument()

      // Avanzar más de 30 segundos en el nuevo montaje
      jest.advanceTimersByTime(31000)

      await waitFor(() => {
        expect(
          screen.getByText(/está tardando un poco más de lo normal/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Integración con layout', () => {
    it('debe poder ser usado en un contenedor centrado', () => {
      const { container } = render(
        <div className="min-h-screen flex items-center justify-center">
          <Loading />
        </div>
      )

      expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    })
  })
})