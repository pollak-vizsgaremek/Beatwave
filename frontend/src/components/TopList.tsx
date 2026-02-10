import Card from './Card'

const TopList = (list) => {
  return (
    <div className="pl-30 ">
        <h2 className="text-2xl font-semibold mb-5">Your top 10 Artists:</h2>
        <div className="flex flex-row overflow-x-visible ml-6">
          {
            list.map((artist, i) => (
              <Card key={i} name={artist.name} image={artist.image} placing={i+1} />
            ))
          }
        </div>
      </div>
  )
}

export default TopList