function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <h1
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          margin: 0,
          fontSize: 18,
          fontFamily: 'system-ui, Segoe UI, Roboto, sans-serif',
          letterSpacing: 0.2,
          color: 'rgba(255,255,255,0.9)',
          zIndex: 1,
          userSelect: 'none',
        }}
      >
        Space Ship
      </h1>
      <canvas id="three-canvas" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default App
