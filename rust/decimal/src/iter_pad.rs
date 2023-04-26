pub struct Pad<I, T>
where
    I: Iterator<Item = T>,
{
    underlying: I,
    size: usize,
    value: T,
    emitted: usize,
}

pub trait PadTrait: Iterator {
    fn pad(self, size: usize, value: Self::Item) -> Pad<Self, Self::Item>
    where
        Self: Sized,
    {
        Pad {
            underlying: self,
            size,
            value,
            emitted: 0,
        }
    }
}

impl<I: Iterator> PadTrait for I {}

impl<I, T> Iterator for Pad<I, T>
where
    I: Iterator<Item = T>,
    T: Copy,
{
    type Item = T;

    fn next(&mut self) -> Option<Self::Item> {
        let result = self.underlying.next();
        let complete = self.emitted >= self.size;
        match (result, complete) {
            (Some(v), _) => {
                self.emitted += 1;
                Some(v)
            }
            (None, false) => {
                self.emitted += 1;
                Some(self.value)
            }
            (None, true) => None,
        }
    }
}
