from autobahn.twisted.wamp import ApplicationSession, ApplicationRunner
from twisted.internet.defer import inlineCallbacks
import random



def getRandomColor():
    return "#%06x" % random.randint(0, 0xFFFFFF)


class Player():
    DEFAULT_LOC = (100, 100)
    DEFAULT_SIZE = 20
    STEP = 5

    def __init__(self, world, sessionid, location=None, size=None):
        print("Creating new player with id {}".format(sessionid))
        self.world = world
        self.id = sessionid
        self.color = getRandomColor()
        self.size = size or Player.DEFAULT_SIZE
        self.location = location or Player.DEFAULT_LOC
        self.world.autobahn.publish(u'com.autobahntest.playerarrived', (self.id, self.color, self.size, self.location))

    def update_location(self, direction):
        print("Updating location of player {}".format(self.id))
        #Check if this move is valid:
        #TODO: latersss, just move for now
        x = y = 0
        if direction == "up":
            x = self.location[0]
            y = self.location[1] - self.STEP
        elif direction == "down":
            x = self.location[0]
            y = self.location[1] + self.STEP
        elif direction == "left":
            x = self.location[0] - self.STEP
            y = self.location[1]
        elif direction == "right":
            x = self.location[0] + self.STEP
            y = self.location[1]

        self.location = (x,y)
        print("Moving {} to {}".format(direction, self.location))
        self.world.autobahn.publish(u'com.autobahntest.updateplayer', (self.id, self.location))
    
class World():
    def __init__(self, autobahn):
        self.players = []
        self.autobahn = autobahn

    def add_player(self, sessionid):
        print("Adding player")
        self.players.append(Player(self, sessionid))

    def move_player(self, sessionid, direction):
        #TODO check if the player doesn't exist
        print("Moving player")
        player = [ player for player in self.players if player.id == sessionid ][0]
        player.update_location(direction)


# Mostly stolen from http://autobahn.ws/python/wamp/programming.html
class PlayerMoveComponent(ApplicationSession):
    DEFAULT_LOC = (100, 100)
    STEP = 5

    # We implement this method which is called when this ApplicationSession registers with the WAMP router.
    # (happens in __main__ block)
    # This is where we setup our pub/sub stuff
    # Using inlineCallbacks instead of Deferreds because the code examples use this
    @inlineCallbacks
    def onJoin(self, details):
        self.id = details.session
        print("CREATING NEW SESSION WITH ID {}".format(self.id))
        self.world = World(self)
        
        try:
            yield self.subscribe(self.world.move_player, u'com.autobahntest.playermove')
            print("Subbed to topic")
            yield self.subscribe(self.world.add_player, u'com.autobahntest.register')
        except Exception as e:
            print("Could not sub to topic : {}".format(e))


    def onLeave(self, details):
        #Tell other clients this player has left
        self.publish(u'com.autobahntest.playerleft', (self.id))



if __name__ == '__main__':
    print("DOING THIS")
    runner = ApplicationRunner(url=u'ws://127.0.0.1:8080/ws', realm=u'realm1')
    runner.run(PlayerMoveComponent)
