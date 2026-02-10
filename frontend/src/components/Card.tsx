type CardProps = {
  key: number;
  name: string;
  image: string;
  placing: number;
};

const Card = (CardProps: any) => {
  return (
    <div key={CardProps.key} className='mr-12'>
      <div className="bg-card rounded-lg p-5 flex flex-col items-center">
        <h1 className="font-bold text-xl">#{CardProps.placing}</h1>
        <div>
          <div className="bg-accent w-24 h-24 mb-4 rounded-full flex items-center justify-center">
            [album pic here]
          </div>
          <h2 className="font-semibold text-lg">{CardProps.name}</h2>
          <p className="text-sm text-gray-400 mt-2">{CardProps.image}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;
