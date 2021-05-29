module.exports = {
  story: {
    title: 'Raconteur',
    subtitle: 'Ghost Writers',
    difficulty: 'Simple',
    description: 'Collaborate in writing stories one line at a time with minimal context.',
    more: 'Raconteur is inspired by improv-type games where players contribute to a story one sentence or one word at a time. ' +
      'The idea is to create unique stories from a train of thought going who knows where. Continuity is held only ' +
      'by the last line in the story, so writing with ambiguity allows for more interesting stories. ' +
      'Similar to old parlor game Consequences.',
    howTo: [
      'Every player will be given a line in a story',
      'Players will continue the story one line at a time',
      'At the end, players can enjoy the crazy stories they wrote together',
    ],
    playTime: '15-20m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numStories: {
        name: 'Story Count',
        text: 'Stories',
        info: 'The number of stories being written',
        type: 'int',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      numLinks: {
        name: 'Lines per Story',
        text: 'Lines',
        info: 'How many lines are in a story',
        type: 'int',
        min: 3,
        max: 256,
        defaults: 10,
      },
      anonymous: {
        name: 'Hide Authors',
        text: 'Anonymous',
        info: 'Whether names are shown at the end.',
        type: 'bool',
        defaults: 'false',
      },
      contextLen: {
        name: 'Context',
        text: 'Context',
        info: 'Adding additional lines of context helps make stories flow better',
        type: 'list',
        defaults: 'regular',
        options: [{
          name: 'regular',
          text: '1 Line',
          value: 1,
        }, {
          name: 'two',
          text: '2 Lines',
          value: 2,
        }, {
          name: 'three',
          text: '3 Lines',
          value: 3,
        }, {
          name: 'four',
          text: '4 Lines',
          value: 4,
        }],
      }
    },
  },
  comic: {
    title: 'Dilettante',
    subtitle: 'Dabble in the Arts',
    difficulty: 'Simple',
    description: 'Collaborate in drawing stories or things one picture at a time with minimal context.',
    more: 'Dilettante is inspired by the game "Exquisite corpse," where players add to a composition one ' +
      'drawing at a time only seeing the last image. According to Wikipedia, this technique was invented by ' +
      'surrealists. Dilettante is Raconteur with pictures and Scribble without words. The gamemode option ' +
      'can make it into Raconteur with pictures, Scribble where everyone draws, or a comic builder.',
    howTo: [
      'Every player will be given a picture drawn by another player',
      'Players continue the composition one drawing at a time',
      'At the end, players can enjoy the funky art they drew together'
    ],
    playTime: '10-15m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numPieces: {
        name: 'Chain Count',
        text: 'Chains',
        info: 'The number of sequences being written',
        type: 'int',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      numLinks: {
        name: 'Drawings per Chain',
        text: 'Drawings',
        info: 'How many drawings are in a sequence',
        type: 'int',
        min: 3,
        max: 256,
        defaults: 4,
      },
      anonymous: {
        name: 'Hide Authors',
        text: 'Anonymous',
        info: 'Whether names are shown at the end.',
        type: 'bool',
        defaults: 'false',
      },
      colors: {
        name: 'Colored Drawings',
        type: 'bool',
        text: 'Colors',
        info: 'Enable drawing in color. Also enables brush thickness.',
        defaults: 'false',
      },
      gamemode: {
        name: 'Game Mode',
        text: 'Mode',
        info: 'What players are given as context for their drawings (Captions, Drawings, or Both).',
        type: 'list',
        defaults: 'regular',
        options: [{
          name: 'regular',
          text: 'Normal',
          more: 'Regular Gameplay (Drawings Only)',
          value: {
            continuous: false,
            captions: false,
            show_drawings: true,
            show_captions: false,
          },
        }, {
          name: 'collab',
          text: 'Collab',
          more: 'One Long Continuous Drawing',
          value: {
            continuous: true,
            captions: false,
            show_drawings: true,
            show_captions: false,
          },
        }, {
          name: 'both',
          more: 'See Drawings and Captions',
          text: 'Comic',
          value: {
            continuous: false,
            captions: true,
            show_drawings: true,
            show_captions: true,
          },
        }, {
          name: 'captions',
          more: 'See Captions Only',
          text: 'Caption',
          value: {
            continuous: false,
            captions: true,
            show_drawings: false,
            show_captions: true,
          },
        }, {
          name: 'drawings',
          more: 'See Drawings Only (Still Write Captions)',
          text: 'Chaos',
          value: {
            continuous: false,
            captions: true,
            show_drawings: true,
            show_captions: false,
          },
        }],
      }
    },
  },
  draw: {
    title: 'Scribble',
    subtitle: 'Drawing Conclusions',
    difficulty: 'Simple',
    description: 'Players alternate between drawing and describing in a telephone-pictionary hybrid game.',
    more: 'Scribble is inspired by games like Tanner Krewson\'s Drawphone, Telestrations, and Pictionary. ' +
      'Players put their minds in maximum overdrive to decipher what on earth the other players are trying ' +
      'to convey with what little space they have. At the end of the game, the pictures and descriptions ' +
      'link together to visualize what on earth everyone is thinking.',
    howTo: [
      'The game is played by alternating between drawing pictures and describing pictures',
      'When given a prompt, players draw it to the best of their abilities',
      'When given an image, players describe it to the best of their abilities',
      'At the end of the game, players can enjoy the chain of pictures and descriptions',
    ],
    playTime: '10-15m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numLinks: {
        name: 'Round Count',
        text: 'Rounds',
        type: 'int',
        info: 'Number of times a chain is added to. If not odd, will be rounded down to an odd number.',
        min: 3,
        max: 256,
        defaults: '#numPlayers',
      },
      colors: {
        name: 'Colored Drawings',
        type: 'bool',
        text: 'Colors',
        info: 'Enable drawing in red, green, blue, and yellow. Also enables brush thickness.',
        defaults: 'false',
      },
      timeLimit: {
        name: 'Time Limit',
        text: 'Time Limit',
        type: 'list',
        info: 'Amount of players have to draw',
        defaults: 'none',
        options: [{
          name: 'none',
          text: 'None',
          more: 'No Limit',
          value: 0,
        }, {
          name: 'sec5',
          text: '5 sec',
          more: '5 seconds',
          value: 5,
        }, {
          name: 'sec15',
          text: '15 sec',
          more: '15 seconds',
          value: 15,
        }, {
          name: 'sec30',
          text: '30 sec',
          more: '30 seconds',
          value: 30,
        }, {
          name: 'min1',
          text: '1 min',
          more: '1 minute',
          value: 60,
        }, {
          name: 'min2',
          text: '2 min',
          more: '2 minutes',
          value: 120,
        }, {
          name: 'min5',
          text: '5 min',
          more: '5 minutes',
          value: 300,
        }],
      },
    },
  },
  redacted: {
    title: 'Redacted',
    subtitle: '█████ ███████',
    difficulty: 'Complex',
    description: 'Collaborate in writing, tampering, and repairing stories one line at a time.',
    more: 'Redacted is an extension upon Raconteur. Players still contribute to a story, however ' +
      'now players are able to interact with the lines other players have written. ' +
      'This game is meant to be played after a familiarity with no context ' +
      'line-by-line stories is established.',
    howTo: [
      'Every player will be given a line in a story',
      'The next player will choose to edit the story by either ' +
        'cutting words off the end, or selecting words in the middle.',
      'Another player will fill in what information was lost',
      'Players will then continue the story, one line at a time',
      'At the end, players can enjoy the crazy stories they wrote',
    ],
    playTime: '15-20m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 4,
        max: 256,
        defaults: '#numPlayers',
      },
      numStories: {
        name: 'Story Count',
        text: 'Stories',
        info: 'The number of stories being written',
        type: 'int',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      numLinks: {
        name: 'Lines per Story',
        text: 'Lines',
        info: 'How many lines are in a story. There will be three times as many rounds.',
        type: 'int',
        min: 2,
        max: 256,
        defaults: 6,
      },
      anonymous: {
        name: 'Hide Authors',
        text: 'Anonymous',
        info: 'Whether names are shown at the end.',
        type: 'bool',
        defaults: 'false',
      },
      edits: {
        name: 'Show Censors',
        info: 'At what point in the game replacement words are displayed.',
        text: 'Censors',
        type: 'list',
        defaults: 'end',
        options: [{
          name: 'end',
          text: 'Show',
          more: 'End of Game',
          value: 1,
        }, {
          name: 'always',
          text: 'Always',
          more: 'All Game',
          value: 0,
        }, {
          name: 'hide',
          more: 'Never',
          text: 'Hide',
          value: 2,
        }],
      },
      gamemode: {
        name: 'Game Mode',
        text: 'Mode',
        type: 'list',
        info: 'Game Mode determines what editing components are used',
        defaults: 'normal',
        options: [{
          name: 'normal',
          text: 'Normal',
          value: {
            censor: 'player',
            truncate: 'player',
          },
        }, {
          name: 'censor',
          text: 'Censor',
          more: 'Censor Only',
          value: {
            censor: 'player',
            truncate: 'none',
          },
        }, {
          name: 'madlib',
          text: 'Spill',
          more: 'Random Censor',
          value: {
            censor: 'random',
            truncate: 'none',
          },
        }, {
          name: 'finish',
          text: 'Finish',
          more: 'Truncate Only',
          value: {
            censor: 'none',
            truncate: 'player',
          },
        }, {
          name: 'shred',
          text: 'Shred',
          more: 'Random Truncate',
          value: {
            censor: 'none',
            truncate: 'random',
          },
        }, {
          name: 'chaos',
          text: 'Chaos',
          more: 'Random',
          value: {
            censor: 'random',
            truncate: 'random',
          },
        }],
      },
      ink: {
        name: 'Ink Amount',
        text: 'Changes',
        info: 'How many changes players can make during edit phase',
        type: 'list',
        defaults: 'normal',
        options: [{
          name: 'normal',
          text: 'Normal',
          more: 'Normal - 2 middle, 5 end',
          value: 10,
        }, {
          name: 'more',
          text: 'More',
          more: 'More - 3 middle, 7 end',
          value: 15,
        }, {
          name: 'many',
          text: 'Many',
          more: 'Many - 5 middle, 12 end',
          value: 25,
        }, {
          name: 'overkill',
          text: 'Overkill',
          more: 'Overkill - enough',
          value: 500,
        }]
      },
    },
  },
  recipe: {
    title: 'Hodgepodge',
    subtitle: 'Sue the Chef',
    difficulty: 'Moderate',
    description: 'Collaborate in splicing together recipes for anything.',
    more: 'Hodgepodge is fairly complicated in the sense that there is not a single ' +
      'streamlined direction for each instruction set. Players submit ' +
      'steps in a recipe following a theme, ingredients without any context, ' +
      'and potential hazards without context. This mixture of randomness and ' +
      'context tends to be awfully delicious.',
    howTo: [
      'Every player will be prompted for a theme for the "dish"',
      'All players contribute a step to the recipe while utilizing ' +
        'an unknown and later defined ingredient without seeing other steps.',
      'All players also will be contributing ingredients, or anything really, ' +
        'to the recipes only seeing the other ingredients.',
      'Hazards and commentary upon the unknown recipes can be provided for an extra ' +
        'dash of chaos,',
      'At the end, players can enjoy the crazy recipes they wrote',
    ],
    playTime: '5-10m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numRecipes: {
        name: 'Recipe Count',
        text: 'Recipes',
        info: 'The number of recipes being written',
        type: 'int',
        min: 1,
        max: 256,
        defaults: '#numPlayers',
      },
      numSteps: {
        name: 'Steps per Recipe',
        text: 'Steps',
        info: 'How many steps and ingredients will be in each recipe.',
        type: 'int',
        min: 2,
        max: 256,
        defaults: 3,
      },
      anonymous: {
        name: 'Hide Authors',
        text: 'Anonymous',
        info: 'Whether names are shown at the end.',
        type: 'bool',
        defaults: 'false',
      },
    },
  },
  assassin: {
    title: 'Wurderer',
    subtitle: 'Murdered by Words',
    difficulty: 'Moderate',
    description: 'Players are each given a target and a word they need to get their targets to say. ' +
      'This website is only a setup for playing the game in person.',
    more: 'Wurderer is inspired the assassin game in hopes to create a game that can be played over the ' +
      'course of multiple days. This website only orchestrates setting up the game by giving players the ' +
      'words they need to get their target to say. Players will have to handle passing their words off ' +
      'to whoever killed them on their own.',
    howTo: [
      'This website does not aid in actually playing the game, only moderation',
      'The game is played in person over conversations',
      'Players are given words they try to get their targets to say',
      'Once a player\'s target says one of those words, the player gets that player\'s target',
      'The last player alive wins!',
    ],
    playTime: '4+hr',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
      numWords: {
        name: 'Word Count',
        text: 'Words',
        info: 'Number of words players receive to kill with',
        type: 'int',
        min: 1,
        max: 5,
        defaults: 2,
      },
      battleRoyale: {
        name: 'Battle Royale Mode',
        text: 'Royale',
        info: 'When enabled, players are given kill words for every player.',
        type: 'bool',
        defaults: 'false',
      },
    },
  },
  locations: {
    hidden: true,
    title: 'Underground',
    subtitle: 'Where are you?',
    difficulty: 'Moderate',
    description: 'One hidden player is trying to figure out where everyone is while avoiding other players\' questioning.',
    more: 'Underground is inspired by hidden role games like Spyfall where everyone is looking for the one player that ' +
      'lying their way to victory.',
    howTo: [
      'Players take turns asking other players questions about the location',
      'The underground player tries to figure out the location before time runs out',
      'The other players try to determine who the underground player is',
      'If the underground player is determined before the time is up, the other players win',
      'If time runs out, the underground player has a minute to guess the location',
      'The underground player can guess the location before time runs out',
      'If that player guesses correctly, he or she wins! Otherwise, everyone else wins!',
    ],
    playTime: '10m',
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'Maximum allowed players in the game',
        type: 'int',
        min: 3,
        max: 10,
        defaults: '#numPlayers',
      },
      duration: {
        name: 'Game Duration (Minutes)',
        text: 'Minutes',
        info: 'How much time players have until the end phase',
        type: 'int',
        min: 1,
        max: 30,
        defaults: 10,
      },
      locationSet: {
        name: 'Location Set',
        text: 'Locations',
        info: 'The possible locations the game can take place',
        type: 'list',
        options: [{
          name: 'campus',
          text: 'Campus',
          value: [
            'Atrium',
            'Basketball Gym',
            'Bowling Alley',
            'Cafe',
            'Chemistry Lab',
            'Classroom',
            'Commons',
            'Dorm',
            'Electrical Closet',
            'Faculty Office',
            'Frat House',
            'Lawn',
            'Library',
            'Machine Shop',
            'Music Room',
            'Nurse\'s Office',
            'Parking Lot',
            'Patio',
            'Police Station',
            'Sports Field',
            'Statue',
            'Swimming Pool',
            'Theatre',
            'Weights Gym',
          ],
        }],
        defaults: 'campus',
      },
    },
  },
};