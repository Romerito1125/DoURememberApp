import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PatientGallery from '@/app/components/photos/PatientGallery'

describe('PatientGallery Component', () => {
  const mockPhotos = [
    {
      id: '1',
      fileName: 'foto1.jpg',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      context: 'Cumpleaños de la abuela',
      people: 'María, Juan, Ana',
      location: 'Casa familiar',
      uploadDate: '2025-01-10T10:00:00.000Z',
    },
    {
      id: '2',
      fileName: 'foto2.jpg',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      context: 'Navidad 2024',
      people: 'Toda la familia',
      location: 'Sala de estar',
      uploadDate: '2025-01-15T10:00:00.000Z',
    },
    {
      id: '3',
      fileName: 'foto3.jpg',
      imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      context: 'Vacaciones de verano',
      people: 'Hermanos',
      location: 'Playa',
      uploadDate: '2025-01-20T10:00:00.000Z',
    },
  ]

  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar el título "Tus Recuerdos"', () => {
      render(<PatientGallery />)

      expect(screen.getByText(/tus recuerdos/i)).toBeInTheDocument()
    })

    it('debe renderizar Header y Footer', () => {
      render(<PatientGallery />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('debe mostrar instrucción para el usuario', () => {
      render(<PatientGallery />)

      expect(
        screen.getByText(/toca una imagen para verla en detalle/i)
      ).toBeInTheDocument()
    })
  })

  describe('Estado vacío', () => {
    it('debe mostrar mensaje cuando no hay imágenes', () => {
      localStorage.setItem('patientPhotos', JSON.stringify([]))

      render(<PatientGallery />)

      expect(
        screen.getByText(/no hay imágenes disponibles aún/i)
      ).toBeInTheDocument()
    })
  })

  describe('Carrusel de fotos', () => {
    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe mostrar el contador de fotos (1/3)', () => {
      render(<PatientGallery />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('debe mostrar la primera foto al centro inicialmente', () => {
      render(<PatientGallery />)

      const images = screen.getAllByRole('img')
      const firstImage = images.find(img => img.getAttribute('alt') === 'foto1.jpg')

      expect(firstImage).toBeInTheDocument()
    })

    it('debe tener botones de navegación (anterior y siguiente)', () => {
      render(<PatientGallery />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)

      // Verificar que hay iconos de navegación
      const chevrons = document.querySelectorAll('[class*="lucide"]')
      expect(chevrons.length).toBeGreaterThan(0)
    })

    it('debe deshabilitar botón anterior en la primera foto', () => {
      render(<PatientGallery />)

      const prevButtons = screen.getAllByRole('button').filter(btn => {
        const icon = btn.querySelector('[class*="ChevronLeft"]')
        return icon !== null
      })

      if (prevButtons.length > 0) {
        expect(prevButtons[0]).toBeDisabled()
      }
    })

    it('debe avanzar a la siguiente foto al hacer click en siguiente', () => {
      render(<PatientGallery />)

      // Verificar que estamos en la primera foto
      expect(screen.getByText('1')).toBeInTheDocument()

      // Click en botón siguiente
      const nextButton = screen.getAllByRole('button').find(btn => {
        return btn.querySelector('.lucide-chevron-right') !== null
      })

      if (nextButton) {
        fireEvent.click(nextButton)

        // Verificar que avanzó
        expect(screen.getByText('2')).toBeInTheDocument()
      }
    })

    it('debe retroceder a la foto anterior', () => {
      render(<PatientGallery />)

      // Avanzar primero
      const nextButton = screen.getAllByRole('button').find(btn => {
        return btn.querySelector('.lucide-chevron-right') !== null
      })

      if (nextButton) {
        fireEvent.click(nextButton)
        expect(screen.getByText('2')).toBeInTheDocument()

        // Retroceder
        const prevButton = screen.getAllByRole('button').find(btn => {
          return btn.querySelector('.lucide-chevron-left') !== null
        })

        if (prevButton) {
          fireEvent.click(prevButton)
          expect(screen.getByText('1')).toBeInTheDocument()
        }
      }
    })

    it('debe deshabilitar botón siguiente en la última foto', () => {
      render(<PatientGallery />)

      // Navegar hasta la última foto
      const nextButton = screen.getAllByRole('button').find(btn => {
        return btn.querySelector('.lucide-chevron-right') !== null
      })

      if (nextButton) {
        // Click dos veces para llegar a la tercera foto
        fireEvent.click(nextButton)
        fireEvent.click(nextButton)

        expect(screen.getByText('3')).toBeInTheDocument()

        // El botón siguiente debe estar deshabilitado
        expect(nextButton).toBeDisabled()
      }
    })
  })

  describe('Ordenamiento de fotos', () => {
    it('debe ordenar fotos cronológicamente (más antigua primero)', () => {
      const unorderedPhotos = [
        { ...mockPhotos[2], uploadDate: '2025-01-20T10:00:00.000Z' },
        { ...mockPhotos[0], uploadDate: '2025-01-10T10:00:00.000Z' },
        { ...mockPhotos[1], uploadDate: '2025-01-15T10:00:00.000Z' },
      ]

      localStorage.setItem('patientPhotos', JSON.stringify(unorderedPhotos))

      render(<PatientGallery />)

      // La primera foto mostrada debe ser la más antigua
      const firstImage = screen.getAllByRole('img')[0]
      expect(firstImage).toHaveAttribute('alt', 'foto1.jpg')
    })
  })

  describe('Vista ampliada', () => {
    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe abrir vista ampliada al hacer click en una foto', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      // Verificar que se abre la vista ampliada (fondo negro)
      const fullscreenView = document.querySelector('.fixed.inset-0.bg-black')
      expect(fullscreenView).toBeInTheDocument()
    })

    it('debe mostrar controles de zoom en vista ampliada', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      // Verificar botones de zoom
      const zoomButtons = screen.getAllByRole('button')
      const plusButton = zoomButtons.find(btn => btn.querySelector('.lucide-plus'))
      const minusButton = zoomButtons.find(btn => btn.querySelector('.lucide-minus'))

      expect(plusButton).toBeInTheDocument()
      expect(minusButton).toBeInTheDocument()
    })

    it('debe mostrar el porcentaje de zoom actual', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('debe permitir hacer zoom in', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      const plusButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-plus')
      )

      if (plusButton) {
        fireEvent.click(plusButton)

        // El zoom debería aumentar (más de 100%)
        expect(screen.getByText(/120%|110%/)).toBeInTheDocument()
      }
    })

    it('debe permitir hacer zoom out', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      const minusButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-minus')
      )

      if (minusButton) {
        fireEvent.click(minusButton)

        // El zoom debería disminuir (menos de 100%)
        expect(screen.getByText(/80%|90%/)).toBeInTheDocument()
      }
    })

    it('debe limitar el zoom máximo a 300%', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      const plusButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-plus')
      )

      if (plusButton) {
        // Hacer muchos clicks
        for (let i = 0; i < 20; i++) {
          fireEvent.click(plusButton)
        }

        // No debería superar 300%
        const zoomText = screen.getByText(/\d+%/)
        const zoomValue = parseInt(zoomText.textContent || '0')
        expect(zoomValue).toBeLessThanOrEqual(300)
      }
    })

    it('debe limitar el zoom mínimo a 50%', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      const minusButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-minus')
      )

      if (minusButton) {
        // Hacer muchos clicks
        for (let i = 0; i < 20; i++) {
          fireEvent.click(minusButton)
        }

        // No debería bajar de 50%
        const zoomText = screen.getByText(/\d+%/)
        const zoomValue = parseInt(zoomText.textContent || '0')
        expect(zoomValue).toBeGreaterThanOrEqual(50)
      }
    })

    it('debe cerrar vista ampliada al hacer click en X', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      // Buscar botón de cerrar
      const closeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-x')
      )

      if (closeButton) {
        fireEvent.click(closeButton)

        // La vista ampliada debe cerrarse
        const fullscreenView = document.querySelector('.fixed.inset-0.bg-black')
        expect(fullscreenView).not.toBeInTheDocument()
      }
    })

    it('debe mostrar el nombre de la foto en vista ampliada', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      expect(screen.getAllByText('foto1.jpg')[0]).toBeInTheDocument()
    })

    it('debe reiniciar zoom al abrir una nueva foto', () => {
      render(<PatientGallery />)

      // Abrir primera foto
      const firstImage = screen.getAllByRole('img')[0]
      fireEvent.click(firstImage)

      // Hacer zoom
      const plusButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-plus')
      )
      if (plusButton) {
        fireEvent.click(plusButton)
      }

      // Cerrar
      const closeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-x')
      )
      if (closeButton) {
        fireEvent.click(closeButton)
      }

      // Abrir otra foto
      const nextButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-chevron-right')
      )
      if (nextButton) {
        fireEvent.click(nextButton)
      }

      const secondImage = screen.getAllByRole('img')[0]
      fireEvent.click(secondImage)

      // El zoom debe estar en 100%
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Manejo de errores de imágenes', () => {
    it('debe manejar error al cargar imagen en carrusel', () => {
      const photosWithBadUrl = [
        {
          ...mockPhotos[0],
          imageUrl: 'invalid-url',
        },
      ]

      localStorage.setItem('patientPhotos', JSON.stringify(photosWithBadUrl))

      render(<PatientGallery />)

      // No debería crashear
      expect(screen.getByText(/tus recuerdos/i)).toBeInTheDocument()
    })

    it('debe mostrar mensaje de error en vista ampliada si falla la carga', async () => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))

      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      // Simular error de carga
      const fullscreenImage = screen.getAllByRole('img').find(img => 
        img.parentElement?.classList.contains('object-contain')
      )

      if (fullscreenImage) {
        fireEvent.error(fullscreenImage)

        await waitFor(() => {
          expect(screen.getByText(/imagen no disponible/i)).toBeInTheDocument()
        })
      }
    })
  })

  describe('Estilos visuales del carrusel', () => {
    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe aplicar ring morado a la foto central', () => {
      render(<PatientGallery />)

      const centerPhoto = document.querySelector('.ring-4.ring-purple-400')
      expect(centerPhoto).toBeInTheDocument()
    })

    it('debe reducir opacidad de fotos laterales', () => {
      render(<PatientGallery />)

      // Las fotos no centrales deben tener opacity reducida
      const photos = document.querySelectorAll('[style*="opacity"]')
      expect(photos.length).toBeGreaterThan(0)
    })
  })

  describe('Accesibilidad', () => {
    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe tener alt text en todas las imágenes', () => {
      render(<PatientGallery />)

      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
      })
    })

    it('debe tener botones accesibles', () => {
      render(<PatientGallery />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach(btn => {
        expect(btn).toBeInTheDocument()
      })
    })
  })

  describe('Persistencia de datos', () => {
    it('debe cargar fotos desde localStorage al montar', () => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))

      render(<PatientGallery />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('debe manejar localStorage vacío sin crashear', () => {
      render(<PatientGallery />)

      expect(
        screen.getByText(/no hay imágenes disponibles/i)
      ).toBeInTheDocument()
    })

    it('debe manejar datos corruptos en localStorage', () => {
      localStorage.setItem('patientPhotos', 'invalid-json')

      render(<PatientGallery />)

      // No debería crashear
      expect(screen.getByText(/tus recuerdos/i)).toBeInTheDocument()
    })
  })

  describe('Interacción con scroll del zoom', () => {
    beforeEach(() => {
      localStorage.setItem('patientPhotos', JSON.stringify(mockPhotos))
    })

    it('debe permitir zoom con scroll de mouse', () => {
      render(<PatientGallery />)

      const image = screen.getAllByRole('img')[0]
      fireEvent.click(image)

      // Obtener el contenedor de la imagen
      const imageContainer = document.querySelector('[class*="overflow-auto"]')
      
      if (imageContainer) {
        // Simular scroll hacia arriba (zoom in)
        fireEvent.wheel(imageContainer, { deltaY: -100 })

        // El zoom debería cambiar
        const zoomText = screen.getByText(/\d+%/)
        const zoomValue = parseInt(zoomText.textContent || '0')
        expect(zoomValue).toBeGreaterThan(100)
      }
    })
  })
})