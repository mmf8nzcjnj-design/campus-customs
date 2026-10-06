/** Yale facts, photo credits and student-discount copy (Problem 10).
 * Facts are well-documented Yale history; keep them short and checkable. */
export const YALE_FACTS = [
  'Yale was founded in 1701 as the Collegiate School. It is the third-oldest college in the United States.',
  "Handsome Dan, adopted in 1889, is often called America's first live college mascot.",
  'The Yale Bowl opened in 1914. It was the first bowl-shaped stadium in the country and gave the Rose Bowl its name.',
  'Harkness Tower, finished in 1921, rises 216 feet over Old Campus and houses a 54-bell carillon.',
  'Yale and Harvard first played football in 1875. Ever since, it has simply been called The Game.',
  '"Boola Boola," the fight song on half our tees, was written in 1900 by Allan M. Hirsh, Class of 1901.',
  "The Beinecke Library's walls are thin marble panes that glow gold when the sun shines through.",
  'Yale\'s motto is "Lux et Veritas": light and truth.',
  'Every Yale undergraduate belongs to one of 14 residential colleges, from Benjamin Franklin to Trumbull.',
  'The Whiffenpoofs, founded in 1909, are the oldest collegiate a cappella group in the US.',
  'Yale students tossing pie tins from the Frisbie Pie Company may have inspired the Frisbee, so legend says.',
  'The Yale Daily News, founded in 1878, calls itself the oldest college daily newspaper in America.',
]

export const STUDENT_DEAL = {
  short: 'Yale students: 10% off everything',
  long: 'Sign in with your @yale.edu email and 10% comes off every order, automatically at checkout.',
}

export const PHOTO_CREDITS = [
  { what: 'Old Campus & Harkness Tower', who: 'Gunnar Klack', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:2014-04-17-Yale-Old-Campus-Courtyard-Harkness-Tower.jpg' },
  { what: 'Harkness Tower in fall', who: 'Hrichardson (WMF)', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Harkness_Tower_Yale_Fall_2014.jpg' },
  { what: 'Old Campus & Durfee Hall', who: 'DimiTalen', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Old_Campus_Courtyard_and_Durfee_Hall,_Yale_University,_New_Haven,_2007.jpg' },
  { what: 'Handsome Dan', who: 'Joeshmonobody', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Handsome_Dan_Kingman.jpg' },
  { what: 'The Game at the Yale Bowl, 2019', who: 'Asdfjrjjj', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Yale_Bowl_Connecticut_football_game_Nov_2019.png' },
]

export const studentPrice = (price: number) => Math.round(price * 0.9 * 100) / 100
