declare module 'react-simple-maps' {
    import { FC, ReactNode, CSSProperties } from 'react'

    interface ProjectionConfig {
        scale?: number
        center?: [number, number]
        rotate?: [number, number, number]
        parallels?: [number, number]
    }

    interface ComposableMapProps {
        projection?: string
        projectionConfig?: ProjectionConfig
        width?: number
        height?: number
        style?: CSSProperties
        children?: ReactNode
    }

    interface GeographiesProps {
        geography: string | object
        children: (data: { geographies: unknown[] }) => ReactNode
    }

    interface GeographyStyleProps {
        default?: CSSProperties & { outline?: string }
        hover?: CSSProperties & { outline?: string }
        pressed?: CSSProperties & { outline?: string }
    }

    interface GeographyProps {
        geography: unknown
        fill?: string
        stroke?: string
        strokeWidth?: number
        style?: GeographyStyleProps
    }

    interface MarkerProps {
        coordinates: [number, number]
        children?: ReactNode
    }

    interface LineProps {
        from: [number, number]
        to: [number, number]
        stroke?: string
        strokeWidth?: number
        strokeLinecap?: string
    }

    interface AnnotationProps {
        subject: [number, number]
        dx?: number
        dy?: number
        children?: ReactNode
    }

    interface GraticuleProps {
        stroke?: string
        strokeWidth?: number
        step?: [number, number]
    }

    interface SphereProps {
        fill?: string
        stroke?: string
        strokeWidth?: number
    }

    export const ComposableMap: FC<ComposableMapProps>
    export const Geographies: FC<GeographiesProps>
    export const Geography: FC<GeographyProps>
    export const Marker: FC<MarkerProps>
    export const Line: FC<LineProps>
    export const Annotation: FC<AnnotationProps>
    export const Graticule: FC<GraticuleProps>
    export const Sphere: FC<SphereProps>
}
