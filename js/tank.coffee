root = exports ? this

_.mixin(
  degreesToRadians: (angleInDegrees) ->
    angleInDegrees * Math.PI / 180
)

root.DIRECTIONS =
  up:
    dx: 0
    dy: -1
  down:
    dx: 0
    dy: 1
  left:
    dx: -1
    dy: 0
  right:
    dx: 1
    dy: 0

root.keyPressList = {}

document.onkeydown = (ev = window.event) ->
  keyPressList[ev.keyCode] = true

document.onkeyup = (ev = window.event) ->
  keyPressList[ev.keyCode] = false

class Map
  tiles:
    '#': [2, 3]
    '@': [0, 6]
    ' ': [0, 0]

  constructor: (mapString) ->
    mapChars = (row.split '' for row in mapString.split "\n")
    @map = (for row in mapChars
      for col in row
        @tiles[col])

  draw: (gfx) ->
    for row, y in @map
      for tile, x in row
        continue if not tile
        gfx.drawSprite tile[0], tile[1], x*gfx.tileWidth, y*gfx.tileHeight

class Tank
  constructor: (params) ->
    @x = params.initialPosition.x
    @y = params.initialPosition.y
    @speed = params.initialSpeed
    @animationFrames = params.animationFrames
    @keyCodes = params.keyCodes

    defaults =
      animationFrames: [1, 2, 3, 4, 5, 6, 7, 8]
      frameIndex: 0
      speed: 10
      x: 50
      y: 50
      height: 32
      width: 32
      direction:
        dx: 0
        dy: 0
        angle: 180
      keyCodes:
        up: 38
        down: 40
        left: 37
        right: 39
        fire: 13

    _.defaults @, defaults

  draw: (gfx) ->
    tileX = Math.floor(@getCurrentFrame() % @animationFrames.length)
    tileY = Math.floor(@getCurrentFrame() / @animationFrames.length)
    destX = @x + (gfx.tileWidth/2)
    destY = @y + (gfx.tileHeight/2)

    gfx.drawRotatedSprite tileX, tileY, destX, destY, @direction.angle

    if not @isStationary()
      @advanceFrame()

  move: ->
    @direction = @updateDirection()
    @x += @direction.dx * @speed
    @y += @direction.dy * @speed
    if @fireKeyIsPressed()
      @fireBullet()

  advanceFrame: ->
    @frameIndex++;
    if @frameIndex is @animationFrames.length
      @frameIndex = 0

  getCurrentFrame: ->
    @animationFrames[@frameIndex]

  updateDirection: ->
    deltas = @updateDeltas()
    angle = @updateAngle()
    newDirection =
      dx: deltas.dx
      dy: deltas.dy
      angle: if _.isNull(angle) then @direction.angle else angle
    newDirection

  updateAngle: ->
    if keyPressList[@keyCodes.up]
      if keyPressList[@keyCodes.left]
        return 315
      else if keyPressList[@keyCodes.right]
        return 45
      else
        return 0
    else if keyPressList[@keyCodes.down]
      if keyPressList[@keyCodes.left]
        return 225
      else if keyPressList[@keyCodes.right]
        return 135
      else
        return 180
    else if keyPressList[@keyCodes.left]
      return 270
    else if keyPressList[@keyCodes.right]
      return 90
    else
      return null

  updateDeltas: ->
    deltas =
      dx: 0
      dy: 0

    pressedDirections = @pressedDirections()

    addToDeltas = (direction) ->
      delta = DIRECTIONS[direction]
      if not _.isUndefined(delta)
        deltas.dx += delta.dx
        deltas.dy += delta.dy

    addToDeltas direction for direction in pressedDirections

    deltas

  pressedDirections: ->
    pressedKeys = _(keyPressList).chain().keys().select((keyCode) -> keyPressList[keyCode]).value()

    if _.isEmpty(pressedKeys)
      return []
    else
      return _(@keyCodes).chain().keys().select((keyCode) =>
        _.include(pressedKeys, @keyCodes[keyCode].toString())
      ).value()

  isStationary: ->
    @direction.dx is 0 and @direction.dy is 0

  fireKeyIsPressed: ->
    fireKeyIsPressed = keyPressList[@keyCodes.fire]
    if _.isUndefined(fireKeyIsPressed)
      return false
    fireKeyIsPressed

  fireBullet: ->
    _.each @fireBulletHandlers, (fireBulletHandler) => fireBulletHandler(@)

  addFireBulletHandler: (fireBulletHandler) ->
    @fireBulletHandlers = @fireBulletHandlers || []
    @fireBulletHandlers.push(fireBulletHandler)

class Bullet
  constructor: (params) ->
    @speed = params.speed || 20

    frame = params.frame || 21
    @tileX = (Math.floor(frame % 8) * 32)
    @tileY = (Math.floor(frame / 8) * 32)

    @firedBy = params.firedBy
    @x = @firedBy.x
    @y = @firedBy.y

    directions = @firedBy.pressedDirections()
    @deltas = @getDeltas(directions)

  draw: (gfx) ->
    # context.save()

    # context.setTransform 1, 0, 0, 1, 0, 0
    # context.translate @x + 16, @y + 16

    # context.drawImage tileSheet, @sourceX, @sourceY, 32, 32, -16, -16, 32, 32

    # context.restore()
    gfx.drawRotatedSprite @tileX, @tileY, @x, @y

  move: ->
    @x += @deltas.dx * @speed
    @y += @deltas.dy * @speed

  getDeltas: (directions) ->
    deltas =
      dx: 0
      dy: 0

    addToDeltas = (direction) ->
      delta = DIRECTIONS[direction]
      if not _.isUndefined(delta)
        deltas.dx += delta.dx
        deltas.dy += delta.dy

    addToDeltas direction for direction in directions

    deltas

class Graphics

  tileWidth: 32
  tileHeight: 32

  constructor: (@context, @tileSheet) ->

  drawSprite: (tileX, tileY, destX, destY) ->
    sourceX = tileX * @tileWidth
    sourceY = tileY * @tileHeight

    @context.save()

    @context.drawImage @tileSheet, sourceX, sourceY, @tileWidth, @tileHeight, destX, destY, @tileWidth, @tileHeight

    @context.restore()

  # drawCenteredSprite: (tileX, tileY, destX, destY) ->
  #   sourceX = tileX * @tileWidth
  #   sourceY = tileY * @tileHeight

  #   @context.save()

  #   @context.setTransform 1, 0, 0, 1, 0, 0
  #   @context.translate destX + @tileWidth/2, destY + @tileHeight/2

  #   @context.drawImage @tileSheet, sourceX, sourceY, @tileWidth, @tileHeight, @tileWidth/2*-1, @tileHeight/2*-1, @tileWidth, @tileHeight

  #   @context.restore()

  drawRotatedSprite: (tileX, tileY, destX, destY, angle=0) ->
    sourceX = tileX * @tileWidth
    sourceY = tileY * @tileHeight

    @context.save()

    @context.setTransform 1, 0, 0, 1, 0, 0
    @context.translate destX + @tileWidth/2, destY + @tileHeight/2
    @context.rotate(_.degreesToRadians(angle))
    @context.drawImage @tileSheet, sourceX, sourceY, @tileWidth, @tileHeight, @tileWidth/2*-1, @tileHeight/2*-1, @tileWidth, @tileHeight

    @context.restore()

window.addEventListener('load', ->
  if not Modernizr.canvas
    return
  else
    theCanvas = document.getElementById 'canvas'
    context = theCanvas.getContext '2d'

  tanks = [
    new Tank(
      initialPosition:
        x: 50
        y: 50
    ),

    new Tank(
      initialPosition:
        x: 450
        y: 450
      animationFrames:
        [ 9, 10, 11, 12, 13, 14, 15, 16 ]
      keyCodes:
        up: 87
        down: 83
        left: 65
        right: 68
        fire: 32
    )
  ]

  objects = tanks.slice 0

  for tank in tanks
    do (tank) ->
      tank.addFireBulletHandler (tank) ->
        # use unshift so that the bullet will go to the
        # front of the array and be drawn underneath the tanks
        objects.unshift new Bullet(firedBy: tank)

  tileSheet = new Image()
  tileSheet.addEventListener('load', ->
    setInterval(drawScreen, 100)
  , false)
  tileSheet.src = 'images/tanks_sheet.png'

  drawScreen = ->

    gfx = new Graphics context, tileSheet

    mapString = """
    #####################
    #  @                #
    #  @                #
    #                   #
    #           @@      #
    #           @       #
    #   @@@     @       #
    #   @               #
    #             @@    #
    #              @@   #
    #       @@@@        #
    #                   #
    #    @         @    #
    #   @@@      @@@    #
    #           @@@     #
    #                   #
    #####################
    """

    map = new Map mapString
    map.draw gfx

    object.move() for object in objects

    object.draw gfx for object in objects

, false)
