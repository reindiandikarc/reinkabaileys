(function () {
  var root = document.documentElement
  var stored = localStorage.getItem('rein-docs-theme')
  var system = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  root.setAttribute('data-theme', stored || system)

  var toggle = document.querySelector('[data-theme-toggle]')
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
      root.setAttribute('data-theme', next)
      localStorage.setItem('rein-docs-theme', next)
    })
  }

  var menu = document.querySelector('[data-menu]')
  var sidebar = document.querySelector('[data-sidebar]')
  if (menu && sidebar) {
    menu.addEventListener('click', function () {
      sidebar.classList.toggle('open')
    })
    document.addEventListener('click', function (event) {
      if (!sidebar.contains(event.target) && !menu.contains(event.target)) sidebar.classList.remove('open')
    })
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var block = button.closest('.code-block')
      if (!block) return
      var code = block.querySelector('code')
      if (!code) return
      var previous = button.textContent
      navigator.clipboard.writeText(code.textContent).then(function () {
        button.textContent = button.getAttribute('data-copied') || 'Copied'
        setTimeout(function () { button.textContent = previous }, 1200)
      }).catch(function () {
        button.textContent = previous
      })
    })
  })

  var links = Array.from(document.querySelectorAll('.toc a'))
  if (links.length && 'IntersectionObserver' in window) {
    var map = new Map()
    links.forEach(function (link) {
      var target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))
      if (target) map.set(target, link)
    })
    var current = null
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        var link = map.get(entry.target)
        if (!link) return
        if (current) current.classList.remove('active')
        link.classList.add('active')
        current = link
      })
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 })
    map.forEach(function (_link, target) { observer.observe(target) })
  }
})()
