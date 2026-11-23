(function () {
  var root = document.documentElement
  var themeKey = 'rein-docs-theme'

  function setTheme(value) {
    root.setAttribute('data-theme', value)
    try { localStorage.setItem(themeKey, value) } catch (error) {}
  }

  var toggle = document.querySelector('[data-theme-toggle]')
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
    })
  }

  var menu = document.querySelector('[data-menu]')
  var sidebar = document.querySelector('[data-sidebar]')
  if (menu && sidebar) {
    function closeMenu() {
      sidebar.classList.remove('open')
      menu.setAttribute('aria-expanded', 'false')
    }
    menu.addEventListener('click', function () {
      var open = sidebar.classList.toggle('open')
      menu.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu()
    })
    document.addEventListener('click', function (event) {
      if (!sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu()
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu()
    })
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var block = button.closest('.code-block')
      if (!block) return
      var code = block.querySelector('code')
      if (!code) return
      var previous = button.textContent
      var copied = button.getAttribute('data-copied') || 'Copied'
      function confirm() {
        button.textContent = copied
        button.setAttribute('data-state', 'copied')
        setTimeout(function () {
          button.textContent = previous
          button.removeAttribute('data-state')
        }, 1200)
      }
      function fallback() {
        var area = document.createElement('textarea')
        area.value = code.textContent
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.opacity = '0'
        document.body.appendChild(area)
        area.select()
        try { document.execCommand('copy'); confirm() } catch (error) {}
        document.body.removeChild(area)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code.textContent).then(confirm).catch(fallback)
      } else {
        fallback()
      }
    })
  })

  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'))
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
